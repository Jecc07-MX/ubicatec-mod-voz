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
        # Navigate to aula.html to open the building categories filter panel
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/ul/li[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select one or multiple building categories (e.g., Aulas, Laboratorios) from the dropdown filter
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[3]/div/select').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select the 'Aulas' category from the dropdown to filter the map markers
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Deselect all filters to verify that all building markers reappear on the map
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[3]/div/select').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Verify the map displays only buildings matching selected categories (e.g., 'Aulas')
        # Assuming markers have a data-category attribute or similar to identify their category
        markers = await frame.locator('css=.map-marker').all()
        visible_markers = []
        for marker in markers:
            is_visible = await marker.is_visible()
            if is_visible:
                category = await marker.get_attribute('data-category')
                visible_markers.append(category)
        assert all(cat == 'Aulas' for cat in visible_markers), f"Not all visible markers are 'Aulas': {visible_markers}"
        
        # Action: Deselect all filters
        deselect_elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[3]/div/select').nth(0)
        await deselect_elem.select_option('Todos los edificios')
        await page.wait_for_timeout(3000)
        
        # Assertion: Verify all building markers reappear on the map
        all_markers = await frame.locator('css=.map-marker').all()
        visible_all_markers = []
        for marker in all_markers:
            if await marker.is_visible():
                visible_all_markers.append(await marker.get_attribute('data-category'))
        assert len(visible_all_markers) > 0, 'No building markers are visible after deselecting filters'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    