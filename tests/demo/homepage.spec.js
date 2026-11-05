const { test, expect } = require('@playwright/test');

test.skip('Homepage', async ({ page })=>{

await page.goto('https://prismworks.io/');
 
const pageTitle = await page.title();
console.log('Page Title is:', pageTitle);

expect(page).toHaveTitle('Sign In')
expect(page).toHaveURL('https://prismworks.io/')

page.close();

})

// test.only('homepage1', async({page})=> {
test('homepage1', async({page})=> {
    await page.goto('https://cmms.tamidas.com/login');
    
    const loginTitle = await page.title();
    console.log('Login Page Title is:', loginTitle);

    // await expect(page).toHaveTitle('Welcome Back');
    await page.getByText('Welcome Back').click();
    await expect(page).toHaveURL('https://cmms.tamidas.com/login')

    await page.close();


})
// Learning GitHub Actions pull request workflow