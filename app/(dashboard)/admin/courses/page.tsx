'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ICourse } from '@/lib/db/models/Course';
import { BookOpen, Edit, Layers, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    description: '',
    difficulty: 'beginner',
    category: '',
    tags: '',
    thumbnail: '',
    isPro: false,
    modules: [],
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not load courses.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      title,
      slug: prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug,
    }));
  };

  const openModal = (course: any = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        ...course,
        tags: course.tags?.join(', ') || '',
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        slug: '',
        description: '',
        difficulty: 'beginner',
        category: '',
        tags: '',
        thumbnail: '',
        isPro: false,
        modules: [],
      });
    }
    setIsModalOpen(true);
  };

  const addModule = () => {
    setFormData((prev: any) => ({
      ...prev,
      modules: [...prev.modules, { title: 'New Module', lessons: [] }],
    }));
  };

  const removeModule = (mIdx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      modules: prev.modules.filter((_: any, i: number) => i !== mIdx),
    }));
  };

  const addLesson = (mIdx: number) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons.push({
      title: 'New Lesson',
      type: 'text',
      content: '',
      duration: 10,
      xpReward: 10,
    });
    setFormData({ ...formData, modules: newModules });
  };

  const removeLesson = (mIdx: number, lIdx: number) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons = newModules[mIdx].lessons.filter((_: any, i: number) => i !== lIdx);
    setFormData({ ...formData, modules: newModules });
  };

  const updateLesson = (mIdx: number, lIdx: number, field: string, value: any) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons[lIdx] = { ...newModules[mIdx].lessons[lIdx], [field]: value };
    setFormData({ ...formData, modules: newModules });
  };

  const updateModuleTitle = (mIdx: number, title: string) => {
     const newModules = [...formData.modules];
     newModules[mIdx].title = title;
     setFormData({ ...formData, modules: newModules });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCourse ? 'PATCH' : 'POST';
      // Calculate totals
      const totalLessons = formData.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0);
      const totalDuration = formData.modules.reduce((acc: number, m: any) => acc + m.lessons.reduce((lAcc: number, l: any) => lAcc + l.duration, 0), 0);

      const body = {
        ...formData,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : formData.tags,
        totalLessons,
        totalDuration,
        courseId: editingCourse?._id,
      };

      const res = await fetch('/api/admin/courses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Action failed');

      const savedCourse = await res.json();
      if (editingCourse) {
        setCourses(courses.map((c: any) => c._id === editingCourse._id ? savedCourse : c));
        toast({ title: 'Success', description: 'Course updated successfully.' });
      } else {
        setCourses([savedCourse, ...courses]);
        toast({ title: 'Success', description: 'Course created successfully.' });
      }
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not save course.', variant: 'destructive' });
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/admin/courses?courseId=${courseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setCourses(courses.filter((c: any) => c._id !== courseId));
      toast({ title: 'Success', description: 'Course deleted.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not delete course.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading courses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1 italic tracking-tight">Course Management</h1>
          <p className="text-muted-foreground text-sm">Manage learning content and curricula.</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course: any) => (
          <div key={course._id} className="bg-card border border-border rounded-lg p-5 flex flex-col hover:border-primary/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen className="h-12 w-12" />
            </div>
            <div className="flex justify-between items-start mb-3">
               <div className="h-10 w-10 rounded-md bg-background border border-border flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  course.difficulty === 'beginner' ? 'text-green-400 border-green-400/30' :
                  course.difficulty === 'intermediate' ? 'text-yellow-400 border-yellow-400/30' :
                  'text-red-400 border-red-400/30'
              }`}>
                {course.difficulty}
              </span>
            </div>
            <h3 className="font-semibold mb-1 line-clamp-1">{course.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{course.description}</p>

            <div className="flex gap-2 text-xs text-muted-foreground mb-4">
              <span className="bg-accent/30 px-2 py-1 rounded border border-border/50">{course.modules?.length || 0} Modules</span>
              <span className="bg-accent/30 px-2 py-1 rounded border border-border/50">{course.totalLessons || 0} Lessons</span>
            </div>

            <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-border border-dashed">
              <button onClick={() => openModal(course)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Edit">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => deleteCourse(course._id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground rounded-lg border border-dashed border-border italic">
            No courses found. Add one to get started.
          </div>
        )}
      </div>

      {/* Write/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                    <p className="text-xs text-muted-foreground">Define curriculum, modules, and lessons.</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-accent rounded-md transition-colors">
                  <X className="h-5 w-5" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
               {/* Core Info */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" /> General Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="title">Course Title</Label>
                          <Input id="title" placeholder="Advanced Penetration Testing" value={formData.title} onChange={handleTitleChange} required className="text-lg font-semibold" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="slug">Slug</Label>
                          <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: generateSlug(e.target.value)})} required className="font-mono text-xs" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input id="category" placeholder="Network Security" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" placeholder="A comprehensive guide to..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required className="h-20" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="difficulty">Difficulty</Label>
                          <select
                            id="difficulty"
                            className="w-full bg-background border border-input h-10 px-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={formData.difficulty}
                            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                      </div>
                      <div className="space-y-2 text-right flex flex-col justify-end">
                          <div className="flex items-center gap-2 justify-end mb-2">
                            <input type="checkbox" id="isPro" checked={formData.isPro} onChange={(e) => setFormData({...formData, isPro: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary" />
                            <Label htmlFor="isPro">Pro Badge (Paid Content)</Label>
                          </div>
                      </div>
                  </div>
               </div>

               {/* Modules & Lessons */}
               <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                       <Plus className="h-4 w-4 text-primary" /> Curriculum Structure
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addModule} className="gap-2">
                       <Plus className="h-3.5 w-3.5" /> Add Module
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {formData.modules.map((module: any, mIdx: number) => (
                      <div key={mIdx} className="bg-accent/20 border border-border rounded-lg p-5 space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-muted-foreground">M{(mIdx + 1).toString().padStart(2, '0')}</span>
                            <Input
                              placeholder="Module Title"
                              value={module.title}
                              onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                              className="bg-transparent border-none text-md font-bold focus:ring-0 p-0 h-auto"
                            />
                            <button type="button" onClick={() => removeModule(mIdx)} className="p-1 hover:text-destructive transition-colors ml-auto">
                               <Trash2 className="h-4 w-4" />
                            </button>
                         </div>

                         <div className="space-y-3 pl-8">
                            {module.lessons.map((lesson: any, lIdx: number) => (
                               <div key={lIdx} className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-4 relative group">
                                  <div className="md:col-span-5 space-y-2">
                                     <Label className="text-[10px] uppercase font-bold text-muted-foreground">Lesson Title</Label>
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono opacity-50">{lIdx + 1}.</span>
                                        <Input value={lesson.title} onChange={(e) => updateLesson(mIdx, lIdx, 'title', e.target.value)} className="h-8 text-sm" />
                                     </div>
                                  </div>
                                  <div className="md:col-span-3 space-y-2">
                                     <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                                     <select
                                       className="w-full bg-background border border-input h-8 px-2 rounded-md text-xs outline-none"
                                       value={lesson.type}
                                       onChange={(e) => updateLesson(mIdx, lIdx, 'type', e.target.value)}
                                     >
                                        <option value="text">Text / Reading</option>
                                        <option value="video">Video Lecture</option>
                                        <option value="quiz">Quiz / Exam</option>
                                        <option value="lab">Interactive Lab</option>
                                     </select>
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                     <Label className="text-[10px] uppercase font-bold text-muted-foreground">Time (min)</Label>
                                     <Input type="number" value={lesson.duration} onChange={(e) => updateLesson(mIdx, lIdx, 'duration', parseInt(e.target.value))} className="h-8 text-sm" />
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                     <Label className="text-[10px] uppercase font-bold text-muted-foreground">XP</Label>
                                     <Input type="number" value={lesson.xpReward} onChange={(e) => updateLesson(mIdx, lIdx, 'xpReward', parseInt(e.target.value))} className="h-8 text-sm" />
                                  </div>
                                  <div className="md:col-span-12 space-y-2">
                                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Content (Markdown / URL)</Label>
                                      <Textarea value={lesson.content} onChange={(e) => updateLesson(mIdx, lIdx, 'content', e.target.value)} className="h-20 text-xs font-mono" placeholder="Internal markdown or external video link..." />
                                  </div>
                                  <button type="button" onClick={() => removeLesson(mIdx, lIdx)} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X className="h-3 w-3" />
                                  </button>
                               </div>
                            ))}
                            <button type="button" onClick={() => addLesson(mIdx)} className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:bg-accent/30 hover:text-primary transition-all flex items-center justify-center gap-2 uppercase tracking-widest font-bold mt-2">
                               <Plus className="h-3 w-3" /> Add Lesson to {module.title}
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </form>

            <div className="p-6 border-t border-border bg-accent/10 flex items-center justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button onClick={handleSubmit} className="gap-2">
                  <Save className="h-4 w-4" />
                  {editingCourse ? 'Update Course' : 'Save Course'}
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
