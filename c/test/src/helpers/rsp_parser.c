/* Copyright © 2026 Apeleg Limited. All rights reserved.
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

#ifdef HAVE_CONFIGURE_H
#include "configure.h"
#endif

#include "rsp_parser.h"

#ifndef HAVE_GETLINE
#error "getline is currently required"
#endif  /* HAVE_GETLINE */

#ifdef HAVE_GETLINE
#define _POSIX_C_SOURCE 200809L
#endif  /* HAVE_GETLINE */
#include <stdio.h>
#include <string.h>
#include <ctype.h>

#ifdef HAVE_GETLINE
#ifdef HAVE_UNISTD_H
/* For ssize_t */
#include <unistd.h>
#endif  /* HAVE_UNISTD_H */
#endif  /* HAVE_GETLINE */

/* Helper to convert a hex character to its integer value */
static int hex_char_to_int(char c)
{
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

/* Helper to convert a hex string to a byte array */
static uint8_t* hex_to_bytes(const char *hex_str, size_t *out_len)
{
    size_t len = strlen(hex_str);
    uint8_t *bytes;
    size_t i;

    /* Must be even length */
    if (len % 2 != 0) return NULL;

    *out_len = len / 2;
    bytes = (uint8_t*)malloc(*out_len);
    if (!bytes) return NULL;

    for (i = 0; i < *out_len; ++i) {
        int high = hex_char_to_int(hex_str[2 * i]);
        int low = hex_char_to_int(hex_str[2 * i + 1]);
        if (high == -1 || low == -1) {
            free(bytes);
            return NULL;
        }
        bytes[i] = (uint8_t)((high << 4) | low);
    }
    return bytes;
}

/* Helper to trim leading/trailing whitespace from a string, in-place. */
static char* trim_whitespace(char *str)
{
    char *end;
    /* Trim leading space */
    while(isspace((unsigned char)*str)) str++;
    if(*str == 0) return str;
    /* Trim trailing space */
    end = str + strlen(str) - 1;
    while(end > str && isspace((unsigned char)*end)) end--;
    end[1] = '\0';
    return str;
}


void free_vector_file(vector_file_t *vf)
{
    size_t i;

    if (!vf) return;

    for (i = 0; i < vf->vector_count; ++i) {
        free(vf->vectors[i].msg);
        free(vf->vectors[i].md);
    }
    free(vf->vectors);
    free(vf);
}

vector_file_t* parse_vector_file(const char *file_path)
{
    FILE *file;
    size_t capacity;
    vector_file_t *vf;

    char *line = NULL;
    size_t len = 0;
    ssize_t read;

    int cur_len_bits = -1;
    char *cur_msg_str = NULL;
    char *cur_md_str = NULL;

    file = fopen(file_path, "r");
    if (!file) {
        perror("Failed to open vector file");
        return NULL;
    }

    vf = (vector_file_t*)calloc(1, sizeof(vector_file_t));
    if (!vf) {
        fclose(file);
        return NULL;
    }

    /* Dynamic array for vectors */
    capacity = 10;
    vf->vectors = (test_vector_t*)malloc(capacity * sizeof(test_vector_t));
    if (!vf->vectors) {
        free_vector_file(vf);
        fclose(file);
        return NULL;
    }

    while ((read = getline(&line, &len, file)) != -1) {
        char *trimmed_line = trim_whitespace(line);
        test_vector_t *new_vecs;
        int l_val;
        char *key;
        char *value;

        trimmed_line = trim_whitespace(line);

        if (strlen(trimmed_line) == 0 || trimmed_line[0] == '#') {
            /* Flush current record if complete */
            if (cur_len_bits != -1 && cur_msg_str && cur_md_str) {
                test_vector_t *current_vector;

                if (vf->vector_count >= capacity) {
                    capacity *= 2;
                    new_vecs = (test_vector_t*)realloc(vf->vectors, capacity * sizeof(test_vector_t));
                    if (!new_vecs) goto error;
                    vf->vectors = new_vecs;
                }
                current_vector = &vf->vectors[vf->vector_count];

                current_vector->len_bits = cur_len_bits;
                if (cur_len_bits == 0) {
                    /* Not NULL */
                    current_vector->msg = (uint8_t*)malloc(1);
                    current_vector->msg[0] = 0;
                    current_vector->msg_len_bytes = 0;
                } else {
                    current_vector->msg = hex_to_bytes(cur_msg_str, &current_vector->msg_len_bytes);
                }
                current_vector->md = hex_to_bytes(cur_md_str, &current_vector->md_len_bytes);

                if(!current_vector->msg || !current_vector->md) goto error;

                vf->vector_count++;

                free(cur_msg_str);
                free(cur_md_str);
                cur_msg_str = cur_md_str = NULL;
                cur_len_bits = -1;
            }
            continue;
        }

        /* Parse [L = N] */
        if (sscanf(trimmed_line, "[L = %d]", &l_val) == 1) {
            vf->digest_length_bytes = l_val;
            continue;
        }

        /* Parse Key = Value */
        key = strtok(trimmed_line, " =");
        value = strtok(NULL, " =");
        if (key && value) {
            if (strcmp(key, "Len") == 0) {
                cur_len_bits = atoi(value);
            } else if (strcmp(key, "Msg") == 0) {
                free(cur_msg_str);
                cur_msg_str = strdup(value);
            } else if (strcmp(key, "MD") == 0) {
                free(cur_md_str);
                cur_md_str = strdup(value);
            }
        }
    }

    /* Flush the last record if file doesn't end with a newline */
    if (cur_len_bits != -1 && cur_msg_str && cur_md_str) {
        test_vector_t *current_vector;
        if (vf->vector_count >= capacity) {
            test_vector_t *new_vecs;

            capacity += 1;
            new_vecs = (test_vector_t*)realloc(vf->vectors, capacity * sizeof(test_vector_t));
            if (!new_vecs) goto error;
            vf->vectors = new_vecs;
        }
        current_vector = &vf->vectors[vf->vector_count];
        current_vector->len_bits = cur_len_bits;
        if (cur_len_bits == 0) {
            current_vector->msg = (uint8_t*)malloc(1);
            current_vector->msg_len_bytes = 0;
        } else {
            current_vector->msg = hex_to_bytes(cur_msg_str, &current_vector->msg_len_bytes);
        }
        current_vector->md = hex_to_bytes(cur_md_str, &current_vector->md_len_bytes);
        if(!current_vector->msg || !current_vector->md) goto error;
        vf->vector_count++;
    }


    free(line);
    free(cur_msg_str);
    free(cur_md_str);
    fclose(file);
    return vf;

error:
    free(line);
    free(cur_msg_str);
    free(cur_md_str);
    free_vector_file(vf);
    fclose(file);
    return NULL;
}
