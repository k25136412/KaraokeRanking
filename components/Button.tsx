import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  // ▼ 丸みを少し強め、文字を太く、押した時に沈み込むアニメーションを追加
  const baseStyles = "px-4 py-3 rounded-xl font-[800] tracking-wider transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:active:translate-y-0 text-lg border border-white/20";

  const variants = {
    // 決定/保存ボタン：DAMの「曲をさがす」風のマゼンタグラデーション＋立体的な厚み
    primary: "bg-gradient-to-b from-pink-500 to-pink-600 text-white shadow-[0_4px_0_#9f1239,0_0_15px_rgba(244,63,94,0.4)]",

    // キャンセルボタン：黒背景にゴールド(黄色)の枠線と文字
    secondary: "bg-gradient-to-b from-slate-800 to-slate-900 text-damgold border-damgold/50 shadow-[0_4px_0_#000000]",

    // 削除ボタン：深い赤のグラデーション
    danger: "bg-gradient-to-b from-red-600 to-red-800 text-white border-red-400 shadow-[0_4px_0_#450a0a]",

    ghost: "bg-transparent text-slate-400 border-transparent hover:text-white shadow-none"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};