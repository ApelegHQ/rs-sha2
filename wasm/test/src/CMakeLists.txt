find_path(CMOCKA_INCLUDE_DIR cmocka.h)
if (NOT CMOCKA_INCLUDE_DIR)
    message(FATAL_ERROR "cmocka.h not found")
endif()
include_directories(${CMOCKA_INCLUDE_DIR})

find_library(CMOCKA_LIBRARY NAMES cmocka)
if (NOT CMOCKA_LIBRARY)
    message(FATAL_ERROR "cmocka library not found")
endif()

# Include the main project include directory and the test helpers
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/helpers
)

# Create the test executable
add_executable(sha2_cavs_tests
    main.c
    helpers/rsp_parser.c
    test_sha_family.c
    test_sha_serialize.c
)

# Link the test executable against our library and cmocka
target_link_libraries(sha2_cavs_tests
    PRIVATE
    wasm_sha2
    ${CMOCKA_LIBRARY}
)

if(WIN32)
    target_link_libraries(sha2_cavs_tests
        PRIVATE
        ws2_32
        ntdll
        userenv
        bcrypt
    )
endif()

# Add a test case to CTest, CMake's testing tool
add_test(NAME sha2_cavs_tests COMMAND sha2_cavs_tests WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/../../ecmascript)
