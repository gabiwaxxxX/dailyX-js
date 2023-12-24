import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv'; // Import dotenv
import { ElementHandle,Page } from 'puppeteer';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

interface Account {
    name: string;
    password: string;
}


// handle single account connection
async function twitterConnection(page : Page, username : string, password : string) {
    try {
        // Navigate the page to a URL
        await page.goto('https://twitter.com/i/flow/login');

        // Wait for the username field to appear
        await page.waitForXPath('//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[1]');
        await page.type('input[autocomplete=username]', username, { delay: 50 });
        // await ((await page.$x("//input[autocomplete=username]"))[0]  as  ElementHandle<HTMLInputElement>).evaluate((input, password) => {input.value = password}, password);
        
        // Click the login button using XPath
        await ((await page.$x('//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[6]'))[0] as ElementHandle).click();

        // Wait for the login button to appear
        await page.waitForXPath('//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[1]/div/div/div[3]');
        await page.type('input[autocomplete=current-password]', password, { delay: 50 });

        // Click the login button using XPath
        await ((await page.$x('//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[1]/div/div/div'))[0] as ElementHandle).click();

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

// check if all accounts are connected
async function checkAccountConnection(page : Page, accounts : Account[]) {
    // await page.goto('https://twitter.com/home');
    sleep(2000);
    const accountMenuXPath = '//*[@id="react-root"]/div/div/div[2]/header/div/div/div/div[2]/div/div';
    await page.waitForXPath(accountMenuXPath);
    // Click the "Account Menu" button
    // await ((await page.$x(accountMenuXPath))[0] as ElementHandle).click();
    // const accountButton = 'div[data-testid="SideNav_AccountSwitcher_Button"]'
    // await page.click(accountButton);
    

    const accountPanelXPath = 'a[data-testid="AccountSwitcher_AddAccount_Button"]';
    let isAccountPannel = false 
    while (!isAccountPannel) {
        await sleep(500);
        if (await page.$(accountPanelXPath) !== null) {
            isAccountPannel = true;
            // console.log("Account panel found");
            break;
        } else {
                await ((await page.$x(accountMenuXPath))[0] as ElementHandle).click();
        }
    }


    // handle case when only one account is connected
    if (accounts.length === 1) {
        const logoutXPath = 'a[href="/logout"]';
        if (await page.$(logoutXPath) !== null) {
            console.log("Account "+accounts[0].name+" is already connected");
        }
        else {
            console.log("Account "+accounts[0].name+" is not connected");
            // await twitterConnection(page, accounts[0].name, accounts[0].password);
            // await sleep(2000);
            // console.log("Account "+accounts[0]+" connected");
        }
        return;

    }

    const liUserCell = 'li[data-testid="UserCell"]';
    await page.waitForSelector(liUserCell);

    for (const account of accounts) {
                await sleep(500);

        try {
            const profileXPath = 'div[data-testid="UserAvatar-Container-'+account.name+'"]';
            if (await page.$(profileXPath) !== null) console.log("Account "+account.name+" is already connected");
            else {
                console.log("Account "+account.name+" is not connected");
                // await ((await page.$x(liUserCell))[0] as ElementHandle).click();
                // await sleep(2000);
                // await twitterConnection(page, account.name, account.password);
                // await sleep(2000);
                // console.log("Account "+account.name+" connected");
            }
        }catch (error) {
            console.error("An error occurred:", error);
        }
    }

}

async function switchAccount(page : Page, account : string) {


    try {
        const profileXPath = 'div[aria-label="Switch to @'+account+'"]';
        if (await page.$(profileXPath) !== null) {
            console.log("Must switch to account "+account);
            await page.click(profileXPath);
            await sleep(2000);
            await switchAccount(page, account);
        } else {

            console.log("Account is already on screen");
            return;
        }
    }catch (error) {
        console.error("An error occurred:", error);
    }

    
}


async function scheduleTweet(page : Page, tweetsOfTheDay : TweetOfTheDay[],description : string = "some description", imagePath : string = "/Users/GabrielFournier/Desktop/be-a-man.png",dateTweet : Date) {

    try {
        await page.goto('https://twitter.com/compose/tweet');
        const postXPath = '//*[@id="layers"]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div/div[3]/div[2]';
        await page.waitForXPath(postXPath);
    
        //click on schedule button
        const scheduleButton = 'div[aria-label="Schedule post"]'
        await page.click(scheduleButton);
        const scheduleXPath = '//*[@id="modal-header"]/span'
        await page.waitForXPath(scheduleXPath);
        console.log(dateTweet)

        const dateDay = dateTweet.getDate();
        const dateMonth = dateTweet.getMonth();
        const dateYear = dateTweet.getFullYear();
        const dateHour = dateTweet.getHours();
        const dateMinute = dateTweet.getMinutes();

        page.select('select[aria-labelledby="SELECTOR_1_LABEL"]', String(dateMonth+1));
        page.select('select[aria-labelledby="SELECTOR_2_LABEL"]', String(dateDay));
        page.select('select[aria-labelledby="SELECTOR_3_LABEL"]', String(dateYear));
        page.select('select[aria-labelledby="SELECTOR_4_LABEL"]', String(dateHour));
        page.select('select[aria-labelledby="SELECTOR_5_LABEL"]',String(dateMinute));

        //confirm
        const confirmButton = 'div[data-testid="scheduledConfirmationPrimaryAction"]'
        await page.click(confirmButton);

        // check if there a multiple part of on tweet i.e description blabla part 1 
        const hasParts = description.includes("part")
        let finalDescription;
        let filesPath=[];
        if (hasParts) {
            filesPath.push(imagePath);
            finalDescription=description.split("part")[0]
            console.log(finalDescription)
            let buildNewPath = imagePath.split("part")[0];
            let i = 2;
            buildNewPath= buildNewPath+"part-"+i+".jpg";
            let fileExists = fs.existsSync(buildNewPath);

            while (fileExists){
                // erase array in tweets
                for (const tweetOfTheDay of tweetsOfTheDay) {
                    for (const tweeterAccount of tweetOfTheDay.tweeterAccounts) {
                        for (const tweet of tweeterAccount.tweets) {
                            if (tweet.filePath === buildNewPath) {
                                const index = tweeterAccount.tweets.indexOf(tweet);
                                tweeterAccount.tweets.splice(index,1);
                            }
                        }
                    }
                }
                console.log(buildNewPath)
                filesPath.push(buildNewPath);
                i++;
                buildNewPath= buildNewPath+"part-"+i+".jpg";
                fileExists = fs.existsSync(buildNewPath);

            }

        }else{
            finalDescription=description;
            filesPath=[imagePath];
        }

        
        const fileChosserButton = 'div[aria-label="Add photos or video"]'
        // Upload an image
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            await page.click(fileChosserButton),
        ]);
        // create a function that will find ramdom image in a folder
        await fileChooser.accept(filesPath);

        await page.type('[role="textbox"]', finalDescription, { delay: 50 });


        // click on schedule button
        const scheduleButton2 = 'div[data-testid="tweetButton"]'
        await page.click(scheduleButton2);
        

        const homeXPath = '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div/div/div[3]/div/div[2]/div[1]/div/div/div/div[2]/div[1]/div/div/div/div/div/div/div/div/div/div/label/div[1]/div/div/div/div/div/div[2]/div';
        console.log("Waiting for the tweet to be posted...");
        await page.waitForXPath(homeXPath);
        console.log("Tweet posted successfully!");
        for (let filePath of filesPath) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }

}

interface TweetOfTheDay  {
    identity : string;
    tweeterAccounts : TweeterAccount[];
}
interface TweeterAccount {
    tweeterId : string;
    tweets : Tweet[];
}
interface Tweet  {
    date : Date;
    description : string;
    filePath : string;
}

async function constructTweetsOfTheDay(deltaDay : number) : Promise<TweetOfTheDay[]> {
    const currentDay = new Date()
    currentDay.setDate(currentDay.getDate()+deltaDay);
    // console.log(currentDay);
    const identitiesFolders = fs.readdirSync("./tweets");
    const tweetsOfTheDay : TweetOfTheDay[] = [];
    for (const identities of identitiesFolders) {
        const tweetAccountPath = "./tweets/"+identities;
        const accountFolders = fs.readdirSync(tweetAccountPath);
        const tweetOfTheDay : TweetOfTheDay = {
            identity : identities,
            tweeterAccounts : []
        }
        for (const tweeterAccount of accountFolders) {
            const tweetAccountPath = "./tweets/"+identities+"/"+tweeterAccount;
            const tweets = fs.readdirSync(tweetAccountPath);
            const tweeteraccount : TweeterAccount = {
                tweeterId : tweeterAccount,
                tweets : []
            }

            for (const tweet of tweets) {
                const filePath = tweetAccountPath+"/"+tweet;
                const fileExists = fs.existsSync(filePath);
                if (fileExists) {
                    const fileSplit = tweet.split("--");
                    const dateSplit = fileSplit[0].split("-");
                    const timeSplit = fileSplit[1].split(":");
                    const dateTweet = new Date(parseInt(dateSplit[0]),parseInt(dateSplit[1])-1,parseInt(dateSplit[2]),parseInt(timeSplit[0]),parseInt(timeSplit[1]),parseInt(timeSplit[2]));
                    // console.log(dateTweet);
                    if (dateTweet.getDate() === currentDay.getDate() && dateTweet.getMonth() === currentDay.getMonth() && dateTweet.getFullYear() === currentDay.getFullYear()) {
                        if ((deltaDay == 0 && dateTweet >= currentDay)  || deltaDay >0 ) {
                            const description = fileSplit[2].split(".")[0];
                            const splitedDescription = description.split("-");
                            const descriptionTweet = splitedDescription.join(" ");

                            const newTweet : Tweet = {
                                date : dateTweet,
                                description : descriptionTweet,
                                filePath : filePath
                            }
                            tweeteraccount.tweets.push(newTweet);
                        }
                    }
                }
            }
            if (tweeteraccount.tweets.length > 0) {
                tweetOfTheDay.tweeterAccounts.push(tweeteraccount);
            }
        }
        if (tweetOfTheDay.tweeterAccounts.length > 0) {
            tweetsOfTheDay.push(tweetOfTheDay);
        }
        
    }

    return tweetsOfTheDay;
}


async function handleConnection(page : Page,accountList: Account[]) {

    let isInit = true;
    await sleep(5000);
    const url = await page.url();
    if (url === "https://twitter.com/i/flow/login" || url === "https://twitter.com/i/flow/login?redirect_after_login=%2Fhome") {
        isInit = false;
    }
    if (!isInit) {
        console.log("No account connected");
        for (const account of accountList) {
            console.log("Connecting account "+account.name);
            await twitterConnection(page, account.name, account.password);
            await sleep(2000);
            console.log("Account "+account.name+" connected");
        }
    }
    await checkAccountConnection(page, accountList);
    await sleep(2000);

}

    
async function main() {
    const identitiesFolders = fs.existsSync("./identities");
    if (!identitiesFolders) {
        fs.mkdirSync("./identities");
    }
    let deltaDay = 0;
    while (true) {
        const listOfTweetsOfTheDay = await constructTweetsOfTheDay(deltaDay);
        console.log(listOfTweetsOfTheDay);
        if (listOfTweetsOfTheDay.length === 0) {
            console.log("No tweets to post today next day");
            deltaDay++;
            if (deltaDay > 7) {
                console.log("No tweets to post for the next 7 days");
                return;
            }
        } else{
            for (const tweetOfTheDay of listOfTweetsOfTheDay) {
                console.log(tweetOfTheDay.tweeterAccounts);
                puppeteer.use(StealthPlugin());
                const folderPath = `./identities/${tweetOfTheDay.identity}`;
                const folderExists = fs.existsSync(folderPath);
                if (!folderExists) {
                    fs.mkdirSync(folderPath);
                }
                console.log(process.env.CHROME_PATH) ;
                const browser = await puppeteer.launch({
                    headless: true,
                    executablePath: `${process.env.CHROME_PATH}`,
                    userDataDir: folderPath+"/userData",
                    args: [
                        `--disable-extensions-except=${process.env.EXTENSION_PATH}`,
                        `--load-extension=${process.env.EXTENSION_PATH}`,
                        '--no-sandbox', '--disable-setuid-sandbox'
                    ],
                });
                const page = await browser.newPage();
                console.log("Opening browser...");
                const accountList = await getListOfAccounts(tweetOfTheDay.identity);
    
                for (const tweeterAccount of tweetOfTheDay.tweeterAccounts) {
                    await page.goto('https://twitter.com/home');
                    await handleConnection(page,accountList);
                    console.log(tweeterAccount.tweeterId);
                    await switchAccount(page, tweeterAccount.tweeterId);
                    for (const tweet of tweeterAccount.tweets) {
                        await scheduleTweet(page,listOfTweetsOfTheDay ,tweet.description, tweet.filePath,tweet.date);
                        await sleep(2000);
                    }
    
                }
                page.close();
                browser.close();

            }
            return;

        }


    }

}



//TODO: pass in a different file
function getListOfAccounts(profile: string): Account[] {
    const filePath = `./identities/${profile}/accounts.json`;

    try {
        // Read the JSON file
        const data = fs.readFileSync(filePath, 'utf8');

        // Parse the JSON data into an object
        const accountData = JSON.parse(data);

        // Convert the object into an array of accounts
        const accounts: Account[] = [];

        for (const key in accountData) {
            if (accountData.hasOwnProperty(key)) {
                accounts.push(accountData[key]);
            }
        }

        return accounts;
    } catch (error) {
        // Handle errors (e.g., file not found, invalid JSON)
        console.error(`Error reading accounts file for profile ${profile}:`, error);
        return [];
    }
}

function sleep(ms : number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
        }
    );
}


async function postTweet(page : Page, description : string = "some description", imagePath : string = "/Users/GabrielFournier/Desktop/be-a-man.png") {

    try {

        // Post a tweet
        await page.goto('https://twitter.com/compose/tweet');
        const postXPath = '//*[@id="layers"]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div/div[3]/div[2]';
        await page.waitForXPath(postXPath);
        await page.type('[role="textbox"]', description, { delay: 50 });
        
        
        // Upload an image
        const fileXPath = '//*[@id="layers"]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div/div[3]/div[2]/div[1]/div/div/div/div[2]/div[2]/div/div/div[1]/div[1]';
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            ((await page.$x(fileXPath))[0] as ElementHandle).click(),
        ]);
        // create a function that will find ramdom image in a folder
        await fileChooser.accept([imagePath]);
        
        // Click the "Tweet" button
        await ((await page.$x(postXPath+'[4]'))[0] as ElementHandle).click();
        //*[@id="layers"]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div/div[3]/div[2]/div[1]/div/div/div/div[2]/div[2]/div/div/div[2]/div[4]

        const homeXPath = '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div/div/div[3]/div/div[2]/div[1]/div/div/div/div[2]/div[1]/div/div/div/div/div/div/div/div/div/div/label/div[1]/div/div/div/div/div/div[2]/div';
        console.log("Waiting for the tweet to be posted...");
        await page.waitForXPath(homeXPath);
        console.log("Tweet posted successfully!");
    } catch (error) {
        console.error("An error occurred:", error);
    }

}

  
// Call the function to start the Twitter login process
main();


