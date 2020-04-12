require("util/util")

Item = Class()

function Item.new(noun, adjectives, children, parent)
   local self = {
      parent = parent,
      noun = noun,
      adjectives = adjectives,
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

Sentence = Class()

function Sentence.new(subject, verb, preposition)
   local self = {
      subject = subject,
      verb = verb,
      preposition = preposition,
   }
   setmetatable(self, Sentence)
   return self
end

Mask = Class()

function subjectMatches(subject, item)
   local noun = item.noun == subject.noun
   local adjective = true
   if subject.adjective then
      adjective = false
      for i, v in ipairs(item.adjectives) do
	 if v == subject.adjective then
	    adjective = true
	 end
      end
   end
   return noun and adjective
end

function Mask.fromSubject(subject, root)
   local self = {root = root}
   setmetatable(self, Mask)
   self:fromSubjectHelper(subject, root)
   return mask
end

function Mask:fromSubjectHelper(subject, root)
   self.match = subjectMatches(subject, root)
   if root.children then
      local children = {}
      self.children = children
      for i, v in root.children do
	 local child = {}
	 table.insert(children, child)
	 Mask.fromSubjectHelper(child, subject, v)
      end
   end
end

function Mask:clone()
   local new = {root = self.root}
   setmetatable(new, Mask)
   self:cloneHelper(new)
   return self
end

function Mask:selectChildren()
   --todo
end

function Mask:set(value)
   self.match = value
   if self.children then
      for i, child in self.children do
	 Mask.set(child, value)
      end
   end
   return self
end

function Mask:cloneHelper(new)
   new.match = self.match
   if self.children then
      local children = {}
      new.children = children
      for i, selfChild in self.children do
	 local child = {}
	 table.insert(children, child)
	 Mask.cloneHelper(selfChild, child)
      end
   end   
end

function Mask:invert()
   self.match = not self.match
   if self.children then
      for i, child in self.children do
	 Mask.invert(child)
      end
   end
   return self
end
