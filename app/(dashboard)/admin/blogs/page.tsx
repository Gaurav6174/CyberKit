'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { IBlog } from '@/lib/db/models/Blog';
import { CheckCircle, Edit, FileText, Globe, Plus, Save, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    tags: '',
    thumbnail: '',
    published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/admin/blogs');
      if (!res.ok) throw new Error('Failed to fetch blogs');
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not load blogs.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug,
    }));
  };

  const openModal = (blog: any = null) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        author: blog.author,
        tags: blog.tags?.join(', ') || '',
        thumbnail: blog.thumbnail || '',
        published: blog.published,
      });
    } else {
      setEditingBlog(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author: '',
        tags: '',
        thumbnail: '',
        published: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBlog ? 'PATCH' : 'POST';
      const body = {
        ...formData,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        blogId: editingBlog?._id,
      };

      const res = await fetch('/api/admin/blogs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Action failed');

      const savedBlog = await res.json();
      if (editingBlog) {
        setBlogs(blogs.map((b: any) => b._id === editingBlog._id ? savedBlog : b));
        toast({ title: 'Success', description: 'Blog updated successfully.' });
      } else {
        setBlogs([savedBlog, ...blogs]);
        toast({ title: 'Success', description: 'Blog created successfully.' });
      }
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not save blog.', variant: 'destructive' });
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const res = await fetch(`/api/admin/blogs?blogId=${blogId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setBlogs(blogs.filter((b: any) => b._id !== blogId));
      toast({ title: 'Success', description: 'Blog deleted.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not delete blog.', variant: 'destructive' });
    }
  };

  const togglePublish = async (blog: any) => {
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId: blog._id, published: !blog.published }),
      });
      if (!res.ok) throw new Error('Update failed');

      const updated = await res.json();
      setBlogs(blogs.map((b: any) => b._id === blog._id ? updated : b));
      toast({ title: 'Success', description: `Post ${updated.published ? 'published' : 'moved to drafts'}.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading blogs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1 italic tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground text-sm">Write and manage platform announcements and articles.</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Write Post
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-accent/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3">Title / Article</th>
                <th className="px-6 py-3 border-l border-border">Status</th>
                <th className="px-6 py-3 border-l border-border">Date</th>
                <th className="px-6 py-3 border-l border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog: any) => (
                <tr key={blog._id} className="border-b border-border hover:bg-accent/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-background border border-border flex shrink-0 items-center justify-center mt-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground line-clamp-1">{blog.title}</div>
                        <div className="text-muted-foreground text-xs line-clamp-1 mt-1">{blog.excerpt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-l border-border">
                    <button
                      onClick={() => togglePublish(blog)}
                      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
                        blog.published
                          ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/30 hover:bg-cyber-green/20'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      {blog.published ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {blog.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 border-l border-border text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 border-l border-border text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openModal(blog)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors inline-block"
                      title="Edit Post"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteBlog(blog._id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors inline-block"
                      title="Delete Post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground border-dashed italic">
                    No blogs written yet. Click "Write Post" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Write/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Edit className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">{editingBlog ? 'Edit Post' : 'Create New Post'}</h2>
                    <p className="text-xs text-muted-foreground">Fill in the details for your blog article.</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-accent rounded-md transition-colors">
                  <X className="h-5 w-5" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="My Awesome Security Blog"
                          value={formData.title}
                          onChange={handleTitleChange}
                          required
                          className="text-lg font-semibold"
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          id="slug"
                          placeholder="post-slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                          required
                          className="pl-9 font-mono text-xs"
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      placeholder="Name or Username"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="A short summary of the post..."
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      required
                      className="h-20"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="content">Content (Markdown supported)</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your article content here..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      className="min-h-[300px] font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      placeholder="security, news, tutorial"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail URL</Label>
                    <Input
                      id="thumbnail"
                      placeholder="https://example.com/image.jpg"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 md:col-span-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="published">Publish immediately</Label>
                  </div>
               </div>
            </form>

            <div className="p-6 border-t border-border bg-accent/10 flex items-center justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button onClick={handleSubmit} className="gap-2">
                  <Save className="h-4 w-4" />
                  {editingBlog ? 'Update Article' : 'Save Article'}
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
