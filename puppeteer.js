import puppeteer from 'puppeteer';

const BASE_URL = 'https://the-internet.herokuapp.com';

async function runTest(testId, testFn) {
  try {
    await testFn();
    console.log(`${testId}: OK`);
  } catch (error) {
    console.error(`${testId}: FAIL`);
    console.error(error.message);
    throw error;
  }
}


(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-crash-reporter'],
  });

  const page = await browser.newPage();


await runTest('1. A/B Testimine', async () => {
  await page.goto(`${BASE_URL}/abtest`);

  const heading = await page.$eval(
    'h3',
    el => el.textContent.trim()
  );

  console.log(heading);
});


  await runTest('2. Lisa/Eemalda Elemendid', async () => {
    await page.goto(`${BASE_URL}/add_remove_elements/`);

    await page.click('button[onclick="addElement()"]');
    await page.click('button[onclick="addElement()"]');

    let deleteButtonCount = await page.$$eval('.added-manually', buttons => buttons.length);
    if (deleteButtonCount !== 2) {
      throw new Error(`Ootasin 2 Delete nuppu, leidsin ${deleteButtonCount}.`);
    }

    await page.click('.added-manually');

    deleteButtonCount = await page.$$eval('.added-manually', buttons => buttons.length);
    if (deleteButtonCount !== 1) {
      throw new Error(`Ootasin peale kustutamist 1 Delete nuppu, leidsin ${deleteButtonCount}.`);
    }
  });

  await runTest('3. Katkised Pildid', async () => {
    await page.goto(`${BASE_URL}/broken_images`);

    const brokenImageCount = await page.$$eval('img', images =>
      images.filter(image => !image.complete || image.naturalWidth === 0).length
    );

    console.log(`Katkiseid pilte: ${brokenImageCount}`);
  });

  await runTest('4. Checkboxes', async () => {
    await page.goto(`${BASE_URL}/checkboxes`);

    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.evaluate(element => element.checked);
      if (!isChecked) {
        await checkbox.click();
      }
    }

    const allChecked = await page.$$eval('input[type="checkbox"]', inputs =>
      inputs.every(input => input.checked)
    );

    if (!allChecked) {
      throw new Error('Mõlemad checkboxid ei ole märgitud.');
    }
  });

  await runTest('5. Kontekstimenüü', async () => {
    await page.goto(`${BASE_URL}/context_menu`);

    page.once('dialog', async dialog => {
      console.log(`Alert: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.click('#hot-spot', {button: 'right'});
  });

  await runTest('6. Loe elemendid', async () => {
    await page.goto(`${BASE_URL}/disappearing_elements`);

    const menuItemCount = await page.$$eval('ul li', items => items.length);

    console.log(`Menüü elemente: ${menuItemCount}`);
  });

  await runTest('7. Dropdown (Rippmenüü)', async () => {
    await page.goto(`${BASE_URL}/dropdown`);

    await page.select('#dropdown', '2');

    const selectedValue = await page.$eval('#dropdown', select => select.value);
    if (selectedValue !== '2') {
      throw new Error(`Ootasin valitud väärtust "2", sain "${selectedValue}".`);
    }
  });

  await browser.close();
})();
