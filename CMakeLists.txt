cmake_minimum_required(VERSION 3.10)

project(www)

file(GLOB SOURCES RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}
    index.html
    package.json
)
file(GLOB_RECURSE PUBLIC RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}
    public/*
)
file(GLOB_RECURSE SRC RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}
    src/*
)

add_custom_command(
    OUTPUT
        ${CMAKE_CURRENT_SOURCE_DIR}/dist/index.html
        ${CMAKE_CURRENT_SOURCE_DIR}/dist/Config.js
    DEPENDS ${SOURCES} ${PUBLIC} ${SRC}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMAND [ ! -d ./node_modules ] && npm install || true
    COMMAND npm run build
)

add_custom_target(${PROJECT_NAME} ALL
    SOURCES ${SOURCES} ${PUBLIC} ${SRC}
    DEPENDS
        dist/index.html
        dist/Config.js
)

if(SNAPCRAFT_BUILD)
    install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/dist/ DESTINATION www)
endif()
