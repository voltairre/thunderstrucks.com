# Additional clean files
cmake_minimum_required(VERSION 3.16)

if("${CONFIG}" STREQUAL "" OR "${CONFIG}" STREQUAL "")
  file(REMOVE_RECURSE
  "CMakeFiles/thunderstruck_autogen.dir/AutogenUsed.txt"
  "CMakeFiles/thunderstruck_autogen.dir/ParseCache.txt"
  "thunderstruck_autogen"
  )
endif()
