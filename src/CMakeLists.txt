cmake_minimum_required(VERSION 4.1.2)

project(thunderstruck VERSION 1.0 LANGUAGES CXX)

find_package(Qt6 REQUIRED COMPONENTS Quick)

qt_standard_project_setup(REQUIRES 6.11.1)

qt_add_executable(thunderstruck
    main.cpp
)

qt_add_qml_module(thunderstruck
    URI thunderstruck
    QML_FILES
    Main.qml
    CoatOfArms.qml

    RESOURCES
    assets/blur_full_green_energy.jpg
)

target_link_libraries(thunderstruck PRIVATE
    Qt6::Quick
)

target_compile_options(thunderstruck PRIVATE
    -Os
    -flto
)

target_link_options(thunderstruck PRIVATE
    -flto
    -O0
    -sWASM_BIGINT
    -sMAX_WEBGL_VERSION=2
    -sWEBGL2_BACKWARDS_COMPATIBILITY_EMULATION
)
