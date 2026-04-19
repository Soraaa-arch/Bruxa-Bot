{ pkgs }: {
  deps = [
    pkgs.nodejs
    pkgs.libuuid
    pkgs.cairo
    pkgs.pango
    pkgs.libjpeg
    pkgs.giflib
    pkgs.librsvg
  ];
}