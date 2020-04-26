require("util/util")
require("util/set")
require("ift/mask")

Item = Class()

function Item.new(noun, adjectives, components, children, parent)
   local self = {
      parent = parent,
      noun = noun,
      adjectives = adjectives and Set.new():addAll(adjectives) or Set.new(),
      components = components and Set.new():addAll(components) or Set.new(),
      children = children,
   }
   setmetatable(self, Item)
   return self
end

function Item:destroy()
   self.parent = nil
   self.noun = nil
   self.adjectives = nil
   self.children = nil
end

--[[--
   For sentences like
   "(Put) (the 6 brown cats) (on the 6 green tables)"
]]
ActionSentence = Class()

function ActionSentence.new(verb, subject, preposition)
   local self = {
      verb = verb,
      subject = subject,
      preposition = preposition,
   }
   setmetatable(self, ActionSentence)
   return self
end

--[[--
   For sentences like
   "(Are) (the 6 cats) (on the tables) (brown)"
]]
QualitySentence = Class()

function QualitySentence.new(verb, subject, preposition, quality)
   local self = {
      verb = verb,
      subject = subject,
      preposition = preposition,
      quality = quality
   }
   setmetatable(self, QualitySentence)
   return self
end

function QualitySentence:eval(scene)
   local matches
   -- get subject
   local subject = Mask.fromSubject(self.subject, scene)
   if self.preposition ~= nil then
      -- get location
      local location = Mask.fromSubject(self.preposition.subject, scene)
      location:selectChildren()
      -- all x on y
      matches = subject:AND(location)
   else
      matches = subject
   end
   -- whether all items must satisfy condition
   local distinct = self.subject.distinct
   local countMatch = 0
   for i, v in ipairs(matches:addToList({})) do
      if qualifies(v, self.quality) then
	 countMatch = countMatch + 1
      end
   end
   if distinct then
      return countMatch == matches:count()
   else
      return countMatch > 0
   end
end

function qualifies(item, quality)
   if quality.component then
      return item.components[quality.component]
   else
      return item.adjectives[quality.adjective]
   end
end
