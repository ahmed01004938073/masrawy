module.exports = {
    apps: [
        {
            name: 'afleet-api',
            script: './server/index.cjs',
            instances: 'max', // Utilize all available CPU cores automatically
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            }
        }
    ]
};
