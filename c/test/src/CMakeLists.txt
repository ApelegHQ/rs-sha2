# Find the cmocka testing framework
# This assumes cmocka is installed system-wide (e.g., via apt, brew, or from source)
find_package(cmocka REQUIRED)
if (NOT cmocka_FOUND)
    message(FATAL_ERROR "cmocka not found. Please install it.")
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
)

# Link the test executable against our library and cmocka
target_link_libraries(sha2_cavs_tests
    PRIVATE
    c_sha2
    cmocka
)

# Add a test case to CTest, CMake's testing tool
add_test(NAME sha2_cavs_tests COMMAND sha2_cavs_tests WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/../../ecmascript)
