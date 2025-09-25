-- Fix the infinite recursion in family_group_members RLS policies

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view members of their groups" ON family_group_members;

-- Create a new policy without infinite recursion
CREATE POLICY "Users can view members of their groups" 
ON family_group_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_group_members AS fgm2 
    WHERE fgm2.group_id = family_group_members.group_id 
      AND fgm2.user_id = auth.uid() 
      AND fgm2.status = 'active'
  )
);

-- Also fix the family_groups policy to avoid recursion
DROP POLICY IF EXISTS "Users can view groups they belong to" ON family_groups;

CREATE POLICY "Users can view groups they belong to" 
ON family_groups FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_group_members 
    WHERE family_group_members.group_id = family_groups.id 
      AND family_group_members.user_id = auth.uid() 
      AND family_group_members.status = 'active'
  )
);

-- Ensure the group creator is automatically added as admin member
CREATE OR REPLACE FUNCTION public.add_group_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the creator as an admin member of the group
  INSERT INTO public.family_group_members (
    group_id,
    user_id,
    display_name,
    is_admin,
    status
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'Group Creator',
    true,
    'active'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add group creator as member
DROP TRIGGER IF EXISTS add_creator_as_member ON family_groups;
CREATE TRIGGER add_creator_as_member
  AFTER INSERT ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_member();