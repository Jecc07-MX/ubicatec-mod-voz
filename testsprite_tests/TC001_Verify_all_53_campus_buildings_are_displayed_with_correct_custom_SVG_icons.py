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
        # Click on the 'Ubica tu Edificio' link to navigate to the campus map page (aula.html)
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/ul/li[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Scroll down to reveal more building markers or extract more detailed marker elements from the map to verify the total count and icon correctness
        await page.mouse.wheel(0, 800)
        

        # Manually verify color coding by visually inspecting the map markers and legend icons on the page to confirm colors match building categories.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Assert that there are exactly 53 building markers visible on the map
        building_markers = await frame.locator('svg.marker-icon').all()
        assert len(building_markers) == 53, f'Expected 53 building markers, found {len(building_markers)}'
          
        # Define expected icon paths for each building type from the legend
        expected_icons = {
            'Aulas': 'Icon/tabler/school.svg',
            'Laboratorios': 'Icon/tabler/microscope.svg',
            'Administrativo': 'Icon/tabler/building.svg',
            'Baños': 'Icon/tabler/toilet-paper.svg',
            'Accesos': 'Icon/tabler/door.svg',
            'Otros': 'Icon/tabler/tools.svg'
        }
          
        # Verify each marker uses the correct custom SVG icon and color coding
        for marker in building_markers:
            # Extract the building type from a data attribute or class (assuming data-type attribute)
            building_type = await marker.get_attribute('data-type')
            assert building_type in expected_icons, f'Unexpected building type: {building_type}'
            # Check the SVG icon href or src attribute
            icon_element = marker.locator('use')
            icon_href = await icon_element.get_attribute('href') or await icon_element.get_attribute('xlink:href')
            assert icon_href and expected_icons[building_type] in icon_href, f'Icon mismatch for building type {building_type}: {icon_href}'
            # Check color coding by inspecting the fill attribute of the SVG path or circle
            svg_fill = await marker.locator('path, circle').first.get_attribute('fill')
            assert svg_fill is not None, 'SVG fill color not found'
            # Optionally, verify fill color matches expected color for building type if known
          
        # Verify markers display tooltips showing the correct building names
        for marker in building_markers:
            tooltip = await marker.get_attribute('title')
            assert tooltip and tooltip.startswith('Edificio'), f'Marker tooltip missing or incorrect: {tooltip}'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    