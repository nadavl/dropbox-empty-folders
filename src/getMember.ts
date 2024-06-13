import { Dropbox } from 'dropbox';
const fetch = require('node-fetch-commonjs')

const ACCESS_TOKEN = '______________';
const MEMBER_EMAIL = 'hanan@theheder.com';
const dbx = new Dropbox({ accessToken: ACCESS_TOKEN, fetch });

async function getMemberDetailsByEmail(email: string) {
    try {
        const response = await dbx.teamMembersGetInfo({
            members: [{ '.tag': 'email', email }]
        });

        //@ts-ignore
        console.log('Response:', response.result[0].profile)
        //@ts-ignore
        if (response.result.members && response.result.members.length > 0) {
        //@ts-ignore
            const member = response.result.members[0];
            console.log('Member Details:', member);
            return member;
        } else {
            console.log('No member found with this email.');
            return null;
        }
    } catch (error) {
        console.error('Error getting member details:', error);
        throw error;
    }
}

(async () => {
    try {
        const memberDetails = await getMemberDetailsByEmail(MEMBER_EMAIL);
        if (memberDetails) {
            console.log(`Member ID: ${memberDetails.profile.team_member_id}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
})();
