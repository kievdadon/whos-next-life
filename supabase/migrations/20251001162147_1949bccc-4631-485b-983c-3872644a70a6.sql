-- Create a security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND status = 'active'
  )
$$;

-- Drop the old recursive policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.family_group_members;

-- Create new non-recursive policy using the security definer function
CREATE POLICY "Users can view members of their groups"
ON public.family_group_members
FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

-- Also fix the family_groups policy to use the same function
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.family_groups;

CREATE POLICY "Users can view groups they belong to"
ON public.family_groups
FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), id));