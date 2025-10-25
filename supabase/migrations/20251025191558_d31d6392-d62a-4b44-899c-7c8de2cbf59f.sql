-- Drop the existing view policy
DROP POLICY IF EXISTS "Users can view groups they belong to" ON family_groups;

-- Create a new policy that allows users to view groups they created OR are members of
CREATE POLICY "Users can view groups they created or belong to" 
ON family_groups 
FOR SELECT 
USING (created_by = auth.uid() OR is_group_member(auth.uid(), id));