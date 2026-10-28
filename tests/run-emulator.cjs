const {spawnSync}=require('node:child_process');
const result=spawnSync('npx --yes firebase-tools@15.34.1 emulators:exec --only firestore,storage --project demo-vicinify --config firebase.test.json "node --test tests/rules.integration.cjs"', {
    stdio:'inherit', shell:true, env:{...process.env,CI:'true',XDG_CONFIG_HOME:require('node:path').join(__dirname,'.firebase-test-config'),NO_UPDATE_NOTIFIER:'1',FIREBASE_CLI_DISABLE_MOTD:'true'}
});
process.exit(result.status ?? 1);

