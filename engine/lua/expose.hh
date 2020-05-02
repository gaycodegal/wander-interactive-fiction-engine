#pragma once

#include "lang.hh"
#ifndef SOL_ALL_SAFETIES_ON
#define SOL_ALL_SAFETIES_ON 1
#endif

#include <sol.hpp>

void expose_to_lua(sol::state& lua);
