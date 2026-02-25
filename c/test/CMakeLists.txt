cmake_minimum_required(VERSION 3.10)
project(c_sha2-library-tests C)
enable_testing()

# Set standard C flags
set(CMAKE_C_STANDARD 90)
set(CMAKE_C_STANDARD_REQUIRED ON)

link_directories(${CMAKE_CURRENT_SOURCE_DIR}/../../target/debug)

# <flags>
include(CheckCompilerFlag)
include(CheckLinkerFlag)

function(try_add_compile_flag LANGUAGE flag var)
    check_compiler_flag("${LANGUAGE}" "${flag}" "${var}")
    if(${${var}})
        set(CMAKE_${LANGUAGE}_FLAGS "${CMAKE_${LANGUAGE}_FLAGS} ${flag}")
    endif()
    set(${var} ${${var}} PARENT_SCOPE)
endfunction()

function(try_add_link_flag LANGUAGE flag var)
    check_linker_flag("${LANGUAGE}" "${flag}" ${var})
    if(${${var}})
        add_link_options("${flag}")
    endif()
    set(${var} ${${var}} PARENT_SCOPE)
endfunction()

# Common warning flags (checked before adding)
set(_warning_flags
    -pedantic
    -pedantic-errors
    -Wall
    -Wextra
    -Wshadow
    -Wstrict-overflow=5
    -Wunused
    -Wfloat-equal
    -Wpointer-arith
    -Wwrite-strings
    -Wformat-security
    -Wmissing-format-attribute
    -Wundef
    -Werror
)

foreach(f IN LISTS _warning_flags)
    try_add_compile_flag(C "${f}" "HAVE_FLAG_${f}")
endforeach()
# </flags>

include(CheckIncludeFile)
check_include_file(unistd.h HAVE_UNISTD_H)

include(CheckFunctionExists)
check_function_exists(getline HAVE_GETLINE CMAKE_REQUIRED_DEFINITIONS "-D_POSIX_C_SOURCE=200809L" CMAKE_REQUIRED_INCLUDES "stdio.h")

configure_file(CMake/configure.h.in generated/configure.h)
include_directories(${CMAKE_BINARY_DIR}/generated)
add_compile_definitions(HAVE_CONFIGURE_H)

# Add the subdirectory containing the tests
add_subdirectory(src)
