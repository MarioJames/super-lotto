'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Upload, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Participant } from '@/lib/types';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [formData, setFormData] = useState({ name: '', employeeId: '', department: '', email: '' });

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.success) {
        setParticipants(data.data);
      }
    } catch {
      toast.error('获取参与人员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('添加成功');
        setIsAddDialogOpen(false);
        setFormData({ name: '', employeeId: '', department: '', email: '' });
        fetchParticipants();
      } else {
        toast.error(data.error || '添加失败');
      }
    } catch {
      toast.error('添加失败');
    }
  };

  const handleEdit = async () => {
    if (!editingParticipant) return;
    try {
      const res = await fetch(`/api/participants/${editingParticipant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('更新成功');
        setIsEditDialogOpen(false);
        setEditingParticipant(null);
        fetchParticipants();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该参与人员吗？')) return;
    try {
      const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchParticipants();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/participants/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success(`导入完成：成功 ${data.data.success} 条，失败 ${data.data.failed} 条`);
        fetchParticipants();
      } else {
        toast.error(data.error || '导入失败');
      }
    } catch {
      toast.error('导入失败');
    }
    e.target.value = '';
  };

  const openEditDialog = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      employeeId: participant.employeeId,
      department: participant.department,
      email: participant.email,
    });
    setIsEditDialogOpen(true);
  };

  const filteredParticipants = participants.filter(p =>
    p.name.includes(searchTerm) ||
    p.employeeId.includes(searchTerm) ||
    p.department.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">参与人员管理</h1>
        <div className="flex gap-2">
          <label>
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            <Button variant="outline" asChild>
              <span><Upload className="h-4 w-4 mr-2" />导入 CSV</span>
            </Button>
          </label>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />添加人员</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加参与人员</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>姓名</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><Label>工号</Label><Input value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} /></div>
                <div><Label>部门</Label><Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
                <div><Label>邮箱</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <Button onClick={handleAdd} className="w-full">添加</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>人员列表 ({filteredParticipants.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="搜索姓名、工号、部门" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">加载中...</div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-8 text-slate-500">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>工号</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.employeeId}</TableCell>
                    <TableCell>{p.department}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑参与人员</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>姓名</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><Label>工号</Label><Input value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} /></div>
            <div><Label>部门</Label><Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
            <div><Label>邮箱</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <Button onClick={handleEdit} className="w-full">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
