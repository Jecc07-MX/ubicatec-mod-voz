import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Click on 'Ubica tu Edificio' link to navigate to the building search page (aula.html)
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/ul/li[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Input partial building name 'Aula' in the search field (index 15) to trigger autocomplete suggestions
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Aula')
        

        # Input a full valid building name or number in the search field to check for autocomplete suggestions and map filtering
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Edificio 4')
        

        # Input an invalid or non-existent building name or number in the search field to verify no autocomplete suggestions appear and map markers remain unchanged
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('NonExistentBuilding123')
        

        # Assert autocomplete suggestions appear matching the input 'Aula'
        frame = context.pages[-1]
        search_input = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(1000)  # wait for suggestions to appear
        suggestions = frame.locator('css=.autocomplete-suggestion')  # assuming suggestions have this class
        assert await suggestions.count() > 0, 'No autocomplete suggestions appeared for partial input "Aula"'
        for i in range(await suggestions.count()):
            suggestion_text = await suggestions.nth(i).inner_text()
            assert 'Aula' in suggestion_text, f'Suggestion "{suggestion_text}" does not match input "Aula"'
          
        # Select one of the autocomplete suggestions (the first one)
        await suggestions.nth(0).click()
        await page.wait_for_timeout(2000)  # wait for map to update
          
        # Verify the map centers on the selected building and relevant marker is highlighted
        map_center = await frame.evaluate('window.map.getCenter()')  # assuming map object is accessible
        highlighted_marker = frame.locator('.marker.highlighted')  # assuming highlighted marker has this class
        assert await highlighted_marker.count() == 1, 'No highlighted marker found after selecting suggestion'
        marker_title = await highlighted_marker.nth(0).get_attribute('title')
        assert 'Aula' in marker_title or 'Edificio' in marker_title, 'Highlighted marker title does not match selected building'
          
        # Input invalid or non-existent building name or number
        await search_input.fill('NonExistentBuilding123')
        await page.wait_for_timeout(1000)  # wait for suggestions to update
        suggestions_count = await suggestions.count()
        assert suggestions_count == 0, 'Autocomplete suggestions appeared for invalid input'
          
        # Verify map markers remain unchanged (assuming initial markers count stored or can be checked)
        initial_markers = await frame.locator('.marker').count()  # assuming markers have class 'marker'
        assert initial_markers > 0, 'No markers found on map initially'
        # After invalid input, markers count should remain the same
        markers_after_invalid_input = await frame.locator('.marker').count()
        assert markers_after_invalid_input == initial_markers, 'Map markers changed after invalid input'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    