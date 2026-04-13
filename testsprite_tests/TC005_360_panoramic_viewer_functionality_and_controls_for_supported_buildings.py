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
        # Click on 'Ubica tu Edificio' link to navigate to building page with 360° viewer support
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/ul/li[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Enter a building number or select a building with 360° panoramic viewer support to open the viewer
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('1')
        

        # Click on the building marker or link for Edificio 1 to open the 360° panoramic viewer
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Try clicking on a different building marker or link that might have 360° panoramic images to open the viewer
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div/div/div[4]/div/div[4]/div[14]/div/img').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Look for and click the button or link to open the 360° panoramic viewer for Edificio 32
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click 'Continuar' button to grant location access permission and proceed to load the 360° panoramic viewer
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[4]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Test rotation controls by interacting with the viewer to rotate horizontally and vertically
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div[3]/div[2]/div[2]/div/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div[3]/div[2]/div[2]/div/div/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Test rotation controls by interacting with the viewer to rotate horizontally and vertically
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div[3]/div[2]/div/div[6]/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div[3]/div[2]/div[2]/div/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Cerrar' button with index 12 to close the 360° panoramic viewer modal and confirm it closes cleanly
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/section/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert the 360° panoramic image is loaded and visible in the A-Frame viewer
        panoramic_image = frame.locator('a-scene a-sky')
        assert await panoramic_image.is_visible(), 'Panoramic image is not visible in the viewer'
        # Assert the A-Frame scene is present indicating the 360° viewer is rendered
        a_frame_scene = frame.locator('a-scene')
        assert await a_frame_scene.is_visible(), 'A-Frame scene is not rendered properly'
        # Test rotation controls by simulating clicks on rotation control elements
        rotation_control_horizontal = frame.locator('xpath=html/body/div[3]/section/div/div[3]/div[2]/div[2]/div/div/a').nth(0)
        rotation_control_vertical = frame.locator('xpath=html/body/div[3]/section/div/div[3]/div[2]/div[2]/div/div/a[2]').nth(0)
        await rotation_control_horizontal.click()
        await rotation_control_vertical.click()
        # Optionally wait a short time to observe smooth rotation
        await page.wait_for_timeout(1000)
        # Verify no rendering glitches by checking the A-Frame scene is still visible after rotation
        assert await a_frame_scene.is_visible(), 'A-Frame scene disappeared after rotation, indicating rendering issues'
        # Close the panoramic viewer modal
        close_button = frame.locator('xpath=html/body/div[3]/section/div/div[3]/button').nth(0)
        await close_button.click()
        # Confirm the viewer modal is closed cleanly without residual UI artifacts
        assert not await a_frame_scene.is_visible(), 'A-Frame scene still visible after closing the viewer, indicating residual UI artifacts'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    