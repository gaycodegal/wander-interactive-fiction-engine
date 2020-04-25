require("util/util")

Mask = Class()

function Mask.fromSubject(subject, root)
   local self = {root = root}
   setmetatable(self, Mask)
   self:fromSubjectHelper(subject, root)
   return self
end

function Mask:fromSubjectHelper(subject, root)
   self.match = subjectMatches(subject, root)
   if root.children then
      local children = {}
      self.children = children
      for i, v in ipairs(root.children) do
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

function Mask:cloneHelper(new)
   new.match = self.match
   if self.children then
      local children = {}
      new.children = children
      for i, selfChild in ipairs(self.children) do
	 local child = {}
	 table.insert(children, child)
	 Mask.cloneHelper(selfChild, child)
      end
   end   
end

function Mask:selectChildren()
   if self.match then
      Mask.set(self, true)
      self.match = false
      return self
   end
   if self.children then
      for i, child in ipairs(self.children) do
	 Mask.selectChildren(child)
      end
   end
   return self
end

function Mask:addToList(list)
   return self:addToListHelper(list, self.root)
end

function Mask:addToListHelper(list, root)
   if self.match then
      table.insert(list, root)
   end
   if self.children then
      for i, child in ipairs(self.children) do
	 Mask.addToListHelper(child, list, root.children[i])
      end
   end
   return list
end

function Mask:count()
   local count = 0
   if self.match then
      count = count + 1
   end
   if self.children then
      for i, child in ipairs(self.children) do
	 count = count + Mask.count(child)
      end
   end
   return count
end

function Mask:set(value)
   self.match = value
   if self.children then
      for i, child in ipairs(self.children) do
	 Mask.set(child, value)
      end
   end
   return self
end

function Mask:invert()
   self.match = not self.match
   if self.children then
      for i, child in ipairs(self.children) do
	 Mask.invert(child)
      end
   end
   return self
end

function Mask:AND(other)
   self.match = self.match and other.match
   if self.children then
      for i, child in ipairs(self.children) do
	 Mask.AND(child, other.children[i])
      end
   end
   return self
end

function subjectMatches(subject, item)
   local noun = item.noun == subject.noun
   local adjective = true
   if subject.adjective then
      adjective = item.adjectives[subject.adjective]
   end
   return noun and adjective
end
