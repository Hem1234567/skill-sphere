
-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  content TEXT,
  module_name TEXT,
  lesson_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons of published courses"
ON public.lessons FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.is_published = true));

CREATE POLICY "Admins full access lessons"
ON public.lessons FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  answer TEXT NOT NULL,
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quizzes of published courses"
ON public.quizzes FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = quizzes.course_id AND courses.is_published = true));

CREATE POLICY "Admins full access quizzes"
ON public.quizzes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Lesson completion tracking
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
ON public.lesson_completions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark lessons complete"
ON public.lesson_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all completions"
ON public.lesson_completions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Quiz attempts tracking
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit quiz attempts"
ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
