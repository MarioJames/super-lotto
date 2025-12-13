import { NextResponse } from 'next/server';

/**
 * GET /api/templates/participants
 * 下载参与人员 CSV 模板
 * Requirements: 1.2
 */
export async function GET() {
  // CSV 模板内容 - 包含正确的列头和示例数据
  const csvContent = `姓名,工号,部门,邮箱
张三,EMP001,技术部,zhangsan@example.com
李四,EMP002,市场部,lisi@example.com`;

  // 返回 CSV 文件
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="participants_template.csv"',
    },
  });
}
