import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Trophy, Gift } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">欢迎使用抽奖系统</h1>
        <p className="text-slate-600 mt-2">支持多种创意抽奖模式，让您的活动更加精彩</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/participants">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>参与人员管理</CardTitle>
                  <CardDescription>导入和管理抽奖参与人员</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                支持 CSV 批量导入，管理参与人员信息
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/activities">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>抽奖活动</CardTitle>
                  <CardDescription>创建和管理抽奖活动</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                配置活动轮次、奖品信息和抽奖模式
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Gift className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>抽奖模式</CardTitle>
                <CardDescription>多种创意抽奖方式</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['双色球', '刮刮乐', '祖玛', '赛马', '转盘', '老虎机'].map((mode) => (
                <span
                  key={mode}
                  className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600"
                >
                  {mode}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>快速开始</CardTitle>
              <CardDescription>三步完成抽奖活动</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-medium">导入参与人员</h3>
              <p className="text-sm text-slate-600">上传 CSV 文件或手动添加</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">2</div>
              <h3 className="font-medium">创建抽奖活动</h3>
              <p className="text-sm text-slate-600">配置轮次和奖品信息</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-2">3</div>
              <h3 className="font-medium">开始抽奖</h3>
              <p className="text-sm text-slate-600">选择模式，开始精彩抽奖</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
