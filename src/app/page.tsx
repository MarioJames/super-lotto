import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calendar, Gift, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-muted p-6 md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {['多模式', '可配置', '开箱即用'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                让抽奖更好玩，也更好用
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                支持多种创意抽奖模式与灵活活动配置，适用于年会、团建、发布会等各类场景。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="sm:w-auto">
                <Link href="/activities">
                  开始创建活动 <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="sm:w-auto">
                <Link href="/participants">先导入参与人员</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              内置模式：双色球、刮刮乐、祖玛、赛马、转盘、老虎机
            </p>
          </div>

          <Card className="h-fit bg-background/60 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle>快速上手</CardTitle>
                  <CardDescription>三步完成一次完整抽奖</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {[
                  { title: '导入参与人员', desc: 'CSV 批量导入或手动添加' },
                  { title: '创建抽奖活动', desc: '配置轮次、奖品与抽奖模式' },
                  { title: '开始抽奖', desc: '选择模式，展示结果与动画' },
                ].map((item, index) => (
                  <li key={item.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/participants">
          <Card className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>参与人员管理</CardTitle>
                  <CardDescription>导入和管理抽奖参与人员</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">支持 CSV 批量导入与搜索筛选</p>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/activities">
          <Card className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>抽奖活动</CardTitle>
                  <CardDescription>创建和管理抽奖活动</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">灵活配置轮次、奖品与动画时长</p>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-yellow-500/10 blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10">
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
                  className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
                >
                  {mode}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle>小贴士</CardTitle>
          <CardDescription>更顺畅地组织一场抽奖</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          建议先完成参与人员导入与清洗（部门/工号），再创建活动并在每轮抽奖前确认奖品与人数设置。
        </CardContent>
      </Card>
    </div>
  );
}
