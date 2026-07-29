import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerGraph AI | 职业跃迁智能实验室",
  description:
    "用可解释的职业图谱、证据评分与情景模拟，比较进入 AI 岗位的可行路径。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
