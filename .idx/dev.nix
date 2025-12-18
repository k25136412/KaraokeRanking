{pkgs}: {
  channel = "stable-24.05";
  # ここに環境変数を設定します
  env = {
    # 自動認証ポップアップを無効化（空文字にする）
    GIT_ASKPASS = "";
    # ターミナルでのパスワード入力を強制的に有効化
    GIT_TERMINAL_PROMPT = "1";
  };
  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}