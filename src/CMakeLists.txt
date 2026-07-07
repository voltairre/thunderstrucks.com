cmake_minimum_required(VERSION 4.1.2)

project(thunderstruck VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt6 REQUIRED COMPONENTS Quick)

qt_standard_project_setup(REQUIRES 6.11.1)

qt_add_executable(thunderstruck
    main.cpp
)

qt_add_qml_module(thunderstruck
    URI thunderstruck
    QML_FILES
        Main.qml
)

target_link_libraries(thunderstruck
    PRIVATE Qt6::Quick
)
