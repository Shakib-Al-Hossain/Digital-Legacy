const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Vault = require('../model/Vault');
const Memory = require('../model/Memory');

exports.backupUserContent = async (user) => {
    try {
        console.log(`Starting background backup for user ${user.email}`);

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 1. Create main folder
        const mainFolderMetadata = {
            name: 'Contents of Digital Legacy',
            mimeType: 'application/vnd.google-apps.folder',
        };
        const mainFolder = await drive.files.create({
            resource: mainFolderMetadata,
            fields: 'id, webViewLink'
        });
        const mainFolderId = mainFolder.data.id;

        // 2. Share main folder with user
        await drive.permissions.create({
            fileId: mainFolderId,
            requestBody: {
                role: 'reader',
                type: 'user',
                emailAddress: user.email
            }
        });

        // 3. Get all vaults for user
        const vaults = await Vault.find({ user: user._id });

        for (const vault of vaults) {
            // Create vault folder inside main folder
            const vaultFolderMetadata = {
                name: vault.vaultName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [mainFolderId]
            };
            const vaultFolder = await drive.files.create({
                resource: vaultFolderMetadata,
                fields: 'id'
            });
            const vaultFolderId = vaultFolder.data.id;

            // Get all memories for this vault
            const memories = await Memory.find({ vault: vault._id });

            for (const memory of memories) {
                if (memory.filePath) {
                    const fullPath = path.join(__dirname, '..', memory.filePath);
                    if (fs.existsSync(fullPath)) {
                        const ext = path.extname(memory.filePath);
                        const fileName = `${memory.title}_${memory.category || 'misc'}${ext}`;

                        const fileMetadata = {
                            name: fileName,
                            parents: [vaultFolderId]
                        };
                        const media = {
                            body: fs.createReadStream(fullPath)
                        };

                        await drive.files.create({
                            resource: fileMetadata,
                            media: media,
                            fields: 'id'
                        });

                        // Delete from local uploads folder
                        fs.unlinkSync(fullPath);
                    }
                }
            }
        }

        // 4. Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Digital Legacy Backup',
            text: `Dear ${user.name}.\nYour account is deactivated successfully. Thank you for using Digital Legacy. Here's the drive link of your uploaded contents in the website ${mainFolder.data.webViewLink}.`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Backup completed and email sent for user ${user.email}`);

    } catch (err) {
        console.error('Background backup error:', err);
    }
};
