{
  description = "Flake for making and developing volumetric videos";

  # Flake inputs
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs"; # also valid: "nixpkgs"
    utils.url = "github:numtide/flake-utils";
  };

  # Flake outputs
  outputs = { self, nixpkgs, utils }:
    utils.lib.eachSystem [
      "x86_64-linux" # 64-bit Intel/AMD Linux
      "aarch64-linux" # 64-bit ARM Linux
      # "x86_64-darwin" # 64-bit Intel macOS
      # "aarch64-darwin" # 64-bit ARM macOS
    ] (system:
      let
        # Helper to provide system-specific attributes
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        # Development environment output
        devShells.default =
          pkgs.mkShell {
            # The Nix packages provided in the environment
            packages = with pkgs; [
              fish
              nodejs
              nodePackages.vscode-langservers-extracted
              nodePackages.typescript-language-server
              inotify-tools
            ];
            shellHook = ''
              fish develop.fish &
              exec fish
            '';
          };
      
        packages.default = pkgs.stdenv.mkDerivation {
          name = "vpt";
          src = ./.;
          nativeBuildInputs = [
            pkgs.makeBinaryWrapper
          ];
          buildInputs = with pkgs; [
            nodejs
          ];
          buildPhase = ''
            mkdir build
            node bin/packer            
          '';
          installPhase = ''
            mkdir -p $out/bin
            cp -R build $out/bin
            cp bin/server-node $out/bin/vpt
            wrapProgram $out/bin/vpt \
              --prefix PATH : ${pkgs.lib.makeBinPath [ pkgs.nodejs ]}
          '';
        };
    });
}
