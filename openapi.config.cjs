const { generateApi } = require('swagger-typescript-api');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

// Swagger API 文档地址
const SWAGGER_URL = 'http://localhost:8101/api/v2/api-docs'

async function generateApiFromSwagger() {
  try {
    // 获取 Swagger JSON
    const response = await axios.get(SWAGGER_URL);
    
    // 将 Swagger JSON 保存到本地文件
    fs.writeFileSync(
      path.resolve(process.cwd(), './swagger.json'),
      JSON.stringify(response.data, null, 2)
    );

    // 生成 API 代码
    await generateApi({
      name: 'api.ts',
      output: path.resolve(process.cwd(), './src/services'),
      input: path.resolve(process.cwd(), './swagger.json'),
      httpClientType: 'custom', // 使用自定义 HTTP client
      moduleNameFirstTag: true,
      generateClient: true,
      customClientPath: path.resolve(process.cwd(), './src/utils/http.ts'),
      templates: path.resolve(process.cwd(), './templates'),
      hooks: {
        onCreateComponent: (component) => {
          return component;
        },
      },
      baseUrl: '/api',
    });

    console.log('API 生成成功！');
  } catch (error) {
    console.error('生成 API 失败:', error);
  }
}

// 执行生成
generateApiFromSwagger();