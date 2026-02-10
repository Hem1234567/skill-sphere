
-- Fix RLS policies: current ones are RESTRICTIVE which means ALL must pass.
-- We need PERMISSIVE policies so ANY matching policy grants access.

-- Drop existing restrictive policies on courses
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

-- Recreate as PERMISSIVE
CREATE POLICY "Anyone can view published courses"
ON public.courses FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Admins full access courses"
ON public.courses FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing restrictive policies on problems
DROP POLICY IF EXISTS "Anyone can view published problems" ON public.problems;
DROP POLICY IF EXISTS "Admins can manage problems" ON public.problems;

-- Recreate as PERMISSIVE
CREATE POLICY "Anyone can view published problems"
ON public.problems FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Admins full access problems"
ON public.problems FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix profiles policies too
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Fix submissions policies
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;

CREATE POLICY "Users can view own submissions"
ON public.submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions"
ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
ON public.submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Fix user_courses policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.user_courses;
DROP POLICY IF EXISTS "Users can enroll" ON public.user_courses;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_courses;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.user_courses;

CREATE POLICY "Users can view own enrollments"
ON public.user_courses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll"
ON public.user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_courses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments"
ON public.user_courses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
