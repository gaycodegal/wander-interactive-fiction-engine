--[[--
   indexing checks metatable first
   and falls back to object if that fails

   @param mt metatable
]]
function metareplacer(mt)
   return function(t, f)
      local v = rawget(t, f)
      if v ~= nil then
	 return v
      end
      return rawget(mt, f)
   end
end

--[[--
   metareplaces t

   @param t table
]]
function meta(t)
   t.__index = metareplacer(t)
end

--[[--
   creates a new already metareplaced object ready to become a class

   @return new class table
]]
function Class()
   local t = {}
   meta(t)
   return t
end
