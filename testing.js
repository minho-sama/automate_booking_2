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
        devtools: true,
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

    //init tampermonkey script https://stackoverflow.com/questions/47304665/how-to-pass-a-function-in-puppeteers-evaluate-method
    await page.evaluate(() => {
        window.initTamperMonkey = function() {
            let globalBookingNumber = null;

            ////////CHANGE ONLY BELOW THAT LINE

            let clickFrequency = 1 //seconds (how often should the program click on "Select date") Recommended is 1 to 5
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

            if(mainBtn.attributes.disabled){
                mainBtn.disabled = false
                console.log("set BTN FROM DISABLED===TRUE TO FALSE")
            }
            mainBtn.click() //submits form

            const unsuccessfulSubmit = document.querySelector('.active').textContent.trim() === "1. Booking data"
            if(unsuccessfulSubmit){
                setTimeout(()=>clickClose(), 200)
            } else{
                stopMonitoring()
                console.log("success, found időpont")

                setTimeout(() => bookAppointment(), (clickFrequency+1)*1000)
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
            });

    await page.evaluate((embassy, application, name, birthDate, phone, email, empName, passport, numOfApp) => { //+++/*D adatok*/
        initTamperMonkey()

        //console.log(embassy, application, name, birthDate, phone, email, empName, passport, numOfApp)

        let hanoi = "hanoi"
        let hoChiMinh = "ho chi minh"
        //ügyintézéseket is kiírni így

        //if A || B || C
            //fill name...passport
            //if(C) fill numOfApp
        //if D
            //futtasson le egy teljesen mást


            //filling inputs (az a baj h nem lehet normálisan beazonosítani az inputfieldeket so ilyen idiótán kell): 
            //option A: írni helperfunctionöket ? mint getPassportField() stb
            //option B: kiválasztani az összes INPUTOT vagy LABELT, és LOOPOLNI! csekkolni, hogy mi a címke (name, date of birth) és az alapján kitölteni!
            
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


