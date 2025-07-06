const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Handle symlinks properly for pnpm
config.resolver.unstable_enableSymlinks = true;

// 4. Add support for additional extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// 5. Handle assets
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

// 6. Transform packages from workspace
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@productivity-app/')) {
    // Force Metro to resolve workspace packages
    const packageName = moduleName.replace('@productivity-app/', '');
    const packagePath = path.resolve(workspaceRoot, 'packages', packageName, 'src', 'index.ts');
    
    return {
      filePath: packagePath,
      type: 'sourceFile',
    };
  }
  
  // Default behavior for other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;