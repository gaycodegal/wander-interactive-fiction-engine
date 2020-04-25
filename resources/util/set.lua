require("util/util")

Set = Class()

function Set.new()
   self = {}
   setmetatable(self, Set)
   return self
end

function Set:add(x)
   self[x] = true
   return self
end

function Set:addAll(t)
   for i, v in ipairs(t) do
      self:add(v)
   end
   return self
end
