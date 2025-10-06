// save this as git-auto.js
import readline from "readline";
import { execSync } from "child_process";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter your commit message: ", (msg) => {
    try {
        console.log("\n🌀 Adding all changes...");
        execSync("git add .", { stdio: "inherit" });

        console.log("📝 Committing changes...");
        execSync(`git commit -m "${msg}"`, { stdio: "inherit" });

        console.log("🚀 Pushing to remote...");
        execSync("git push", { stdio: "inherit" });

        console.log("\n✅ All done!");
    } catch (err) {
        console.error("\n❌ Error:", err.message);
    } finally {
        rl.close();
    }
});
