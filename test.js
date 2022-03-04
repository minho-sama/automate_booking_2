var puppeteer = require('puppeteer');
var XLSX = require('xlsx')

var browser;

//reading worksheet
var workbook = XLSX.readFile('./sampleData/A&B.csv');
let parsedWorkbook = XLSX.utils.sheet_to_json(workbook.Sheets.Sheet1);

(async () => {

    browser = await puppeteer.launch( { 
        headless: false,
        ignoreDefaultArgs: ["--disable-extensions"],
        // devtools: true,
        defaultViewport: null
        // executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
     })

    parsedWorkbook.forEach( client=> {
        const {
            embassy, 
            application, 
            name, 
            birthDate, 
            phone, 
            email, 
            empName, 
            passport, 
            numOfApp
        } = client //destructure
        openTab(embassy, application, name, birthDate, phone, email, empName, passport, numOfApp)
    })


})();

//function containing the 2 scripts
async function openTab(embassy, application, name, birthDate, phone, email, empName, passport, numOfApp) {
    const page = await browser.newPage();

    await page.goto('https://konzinfobooking.mfa.gov.hu/home');

    //fill with PUPPETEER, not vanilla ? after selecting embassy and stuff

    //open embassy list
    await page.waitForSelector("#m1 > div > fieldset > div:nth-child(1) > div > ng-select")
    await page.click("#m1 > div > fieldset > div:nth-child(1) > div > ng-select")

    //click on embassy
    if(embassy === "hanoi") await page.evaluate(()=> {
        setTimeout(()=> document.querySelectorAll(".ng-option")[75].click(), 1)
    })
    if(embassy === "ho chi minh") await page.evaluate(()=> {
        setTimeout(()=> document.querySelectorAll(".ng-option")[76].click(), 1)
    })

    if(application === "visa employment") await page.evaluate(()=> { // only hanoi
        let sel = document.querySelector("#m1 > div > fieldset > div:nth-child(3) > div > ng-select > div > div > div.ng-input > input[type=text]");
        sel.value = 'Visa application'
        sel.dispatchEvent(new Event('input'));
        sel.dispatchEvent(new Event('blur'));
        setTimeout(()=> {
            Array.from(document.querySelectorAll(".ng-option")).filter((node)=> {
                return node.textContent.includes("visa") && node.textContent.includes("employment")  && !node.textContent.includes("Diplomatic")
            })[0].click()
        }, 1000)
    })

    if(application === "visa family") await page.evaluate(()=> {
        let sel = document.querySelector("#m1 > div > fieldset > div:nth-child(3) > div > ng-select > div > div > div.ng-input > input[type=text]");
        sel.value = 'Visa application'
        sel.dispatchEvent(new Event('input'));
        sel.dispatchEvent(new Event('blur'));
        setTimeout(()=> {
            Array.from(document.querySelectorAll(".ng-option")).filter((node)=> {
                return node.textContent.includes("visa") && node.textContent.includes("family reunification") && !node.textContent.includes("other")
            })[0].click()
            console.log("yeet")
        }, 1000) 
    })

    await page.waitForSelector("#m1 > div > fieldset > div:nth-child(6) > div > div > input")
    await page.type("#m1 > div > fieldset > div:nth-child(6) > div > div > input", birthDate)

    //click on application
            //ADATOKAT MÁR VANILLA JS-sel kitölteni ?!!! írni helperFunctionöket!!! (getNameInput, get EmailInput, stb) mert más ügyintézésnél más lesz a selector!!!

            // vagy puppeteer
            // await page.waitForSelector("#m1 > div > fieldset > div:nth-child(9) > div > input")
            // await page.type("#m1 > div > fieldset > div:nth-child(9) > div > input", email)

    //fill with puppeteer, not vanilla

    //init tampermonkey script https://stackoverflow.com/questions/47304665/how-to-pass-a-function-in-puppeteers-evaluate-method
    await page.evaluate(() => {
        window.initTamperMonkey = function() {
            let globalBookingNumber = null;

            ////////CHANGE ONLY BELOW THAT LINE

            let clickFrequency = 5 //seconds (how often should the program click on "Select date") Recommended is 1 to 5
            let inactivityTimeout = 10 //seconds (how much should the program wait until going back to the first page, if there is an error with booking a date ). Recommended is more than 7

            ////////CHANGE ONLY ABOVE THIS LINE


            //init start btn
            var strtBtn = document.createElement("div")
            strtBtn.style = `cursor: pointer;
                            background:#23c24d;
                            position:absolute;
                            width: 100px;
                            right: 10px;
                            bottom: 40%;
                            padding-left: 5px;
                            font-weight: bold;
                            color: #000
                            `
            strtBtn.addEventListener("click", function(){
                initMonitoring()
            })
            strtBtn.addEventListener("mouseover", function(){
                strtBtn.style.background = "#0b5c20"
            })
            strtBtn.addEventListener("mouseout", function(){
                strtBtn.style.background = "#23c24d"
            })

            strtBtn.textContent = "START WATCHING"
            strtBtn.classList.add("nam-custom-btn")
            setTimeout(()=>document.body.appendChild(strtBtn), 1100)

            //init stop btn
            var stopBtn = document.createElement("div")
            stopBtn.style = `cursor: pointer;
                            background:#cc2323;
                            position:absolute;
                            width: 100px;
                            right: 10px;
                            bottom: 30%;
                            padding-left: 5px;
                            font-weight: bold;
                            color: #000
                            `
            stopBtn.addEventListener("click", function(){
                stopMonitoring()
            })

            stopBtn.addEventListener("mouseover", function(){
                stopBtn.style.background = "#690808"
            })
            stopBtn.addEventListener("mouseout", function(){
                stopBtn.style.background = "#cc2323"
            })
            stopBtn.textContent = "STOP WATCHING"
            stopBtn.classList.add("nam-custom-btn")
            setTimeout(()=>document.body.appendChild(stopBtn), 1100)


            let strtMonitoring = null

            function initMonitoring(){
                while(isNaN(globalBookingNumber) || globalBookingNumber > 20 || globalBookingNumber < 1){
                    globalBookingNumber = parseInt(window.prompt("Please enter a number from 1 to 20", ""), 10);
                }

            strtMonitoring = setInterval(clickSubmitBtn, clickFrequency*1000)
            }

            //main
            function clickSubmitBtn(){
                console.log("interval started")
                let mainBtn = document.querySelector(".btn.btn-primary")

            if(mainBtn.disabled){
                mainBtn.disabled=false
                console.log("set BTN FROM DISABLED===TRUE TO FALSE")
            }
            mainBtn.click() //submits form

            const unsuccessfulSubmit = document.querySelector('.active').textContent.trim() === "1. Booking data"
            if(unsuccessfulSubmit){
                setTimeout(()=>clickClose(), 200)
            } else{
                stopMonitoring()
                console.log("success, found időpont")

                setTimeout(() => bookAppointment(), 2000)
            }
            }

            function clickClose(){
                document.querySelector(".ekif-modal-footer button").click()
                console.log("no időpont, clicked close")
            }

            function stopMonitoring(){
            clearInterval(strtMonitoring)
            console.log("stopped monitoring")
            }

            //successful_select_date
            function bookAppointment(){

            let bookingNum = globalBookingNumber
            while(bookingNum >= 0){
                console.log(bookingNum)
                if(document.querySelectorAll("datatable tbody tr")[bookingNum-1]){
                document.querySelectorAll("datatable tbody tr")[bookingNum-1].click()
                break
                }
                bookingNum -= 1
            }

            const btns = document.querySelectorAll(".btn.btn-primary")
            for(let i = 0; i < btns.length; i++){
                if(btns[i].textContent.trim() === "Continue"){
                    btns[i].click()
                    console.log("clicked on continue button")
                    setTimeout(() => {
                        document.querySelector("#anchor-state #checkbox").click()
                    }, 2000)
                }
            }

            //inactivity check
            setTimeout(()=>{
                if(document.querySelector('.active').textContent.trim() === "2. Select a date" && document.querySelector('.active').textContent.trim() !== "3. Validate booking" && document.querySelector('.active').textContent.trim() !== "1. Booking data"){
                    console.log("ERROR (inactivity) occured, going back to first tab")
                    document.querySelector(".button-back .btn.btn-primary").click();
                    strtMonitoring = setInterval(clickSubmitBtn, clickFrequency*1000) // option B: click on START -> asking bookingNum again ?
                }
            }, inactivityTimeout*1000)
            }
        };

        window.findLabel = function(label){
            return Array.from(document.querySelectorAll(".control-label")).filter((node) =>node.textContent.includes(label))[0]
        }

        window.findInputAndFill = function(label, personData){
            let input = findLabel(label).parentElement.querySelector(`input`)
            input.value = personData
            input.dispatchEvent(new Event('input'));
            input.dispatchEvent(new Event('blur'));
        }

        window.initFillBtn = function(name, birthDate, phone, email, empName, passport, numOfApp){
            
            var fillBtn = document.createElement("div")
            fillBtn.style = `cursor: pointer;
                            background:black;
                            position:absolute;
                            width: 100px;
                            right: 10px;
                            bottom: 20%;
                            padding-left: 5px;
                            font-weight: bold;
                            color: white
                            `
            fillBtn.textContent="FILL"
            document.body.appendChild(fillBtn)
            fillBtn.addEventListener("click", () => {
                
                window.findInputAndFill("Name", name)
                window.findInputAndFill("Phone number", phone)
                window.findInputAndFill("E-mail address", email)
                window.findInputAndFill("Passport", passport)
                document.querySelectorAll(`.outer`).forEach(el=>el.click())
                if (findLabel("Name of employer")){
                    window.findInputAndFill("Name of employer", empName)
                }
                if(findLabel("Number of applicants")){
                    window.findInputAndFill("Number of applicants", numOfApp)
                }

                //hcm emp+diplomatic


                
                //az utso visa ugyre is megcsinalni a kitoltest
                //stackoverflow, prefix, kevin mindenki - hogyan tudom automatizalni a vpn ujrainditast??

            })
            // setTimeout(()=> fillBtn.click(), 5000)

        }
    });

    await page.evaluate((embassy, application, name, birthDate, phone, email, empName, passport, numOfApp) => { //+++/*D adatok*/
        initTamperMonkey()

        initFillBtn(name,birthDate, phone, email, empName, passport, numOfApp)

        //after filling, click on START btn

        //console.log(embassy, application, name, birthDate, phone, email, empName, passport, numOfApp)

        //if A || B || C
            //fill name...passport
            //if(C) fill numOfApp
        //if D
            //futtasson le egy teljesen mást


            //filling inputs (az a baj h nem lehet normálisan beazonosítani az inputfieldeket so ilyen idiótán kell): 
            //option A: írni helperfunctionöket ? mint getPassportField() stb
            // option B: puppeteer xpath? 
            //option C: kiválasztani az összes INPUTOT vagy LABELT, és LOOPOLNI! csekkolni, hogy mi a címke (name, date of birth) és az alapján kitölteni!
            
            //select dropdown
            //await page.select('#telCountryInput', 'my-value') ?
            //document.querySelector("#a83bdf569556").classList.add("ng-option-selected", "ng-option-marked")
        
        /*
        -A: hanoi emb employment && B: ho chi minh emb family reuni
            name
            date of birth
            phone num
            email
            Name of employer
            Passport number
        -C: hanoi emb family reunification
            +number of applicant
        -D: ho chi minh emb employment + diplomatic legislation
            //sok
        */

        //fill out form


    },embassy, application, name, birthDate, phone, email, empName, passport, numOfApp);
}


