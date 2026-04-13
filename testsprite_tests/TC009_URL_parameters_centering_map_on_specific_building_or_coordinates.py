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
        # Navigate to aula.html with ?edificio=5 parameter to test map centering on building ID 5.
        await page.goto('http://localhost:3000/aula.html?edificio=5', timeout=10000)
        

        # Scroll down and visually inspect the map area and markers to confirm if the map is centered on building 5 and if the marker is highlighted.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Navigate to aula.html with ?coords=19.05,-98.22 parameter to test map centering on specific GPS coordinates and check for marker highlight or errors.
        await page.goto('http://localhost:3000/aula.html?coords=19.05,-98.22', timeout=10000)
        

        # Verify visually or by extraction if any marker highlight or emphasis appears when the building ID or coordinates are specified, and confirm no errors occur if coordinates do not match any building.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Assert map centers on building ID 5 by checking map center coordinates or marker highlight class
        map_center = await page.evaluate('''() => {
          const map = window.mapInstance;  // Assuming mapInstance is the Leaflet map object
          if (!map) return null;
          const center = map.getCenter();
          return { lat: center.lat, lng: center.lng };
        }''')
        assert map_center is not None, 'Map instance not found on page for edificio=5 test'
        # Expected coordinates for building ID 5 (example, replace with actual expected coords)
        expected_lat, expected_lng = 19.05, -98.22
        assert abs(map_center['lat'] - expected_lat) < 0.01 and abs(map_center['lng'] - expected_lng) < 0.01, f'Map center {map_center} not close to expected building 5 location'
        # Check if building marker is highlighted (assuming highlighted marker has a specific CSS class)
        highlighted_marker = await page.query_selector('.marker.highlighted')
        assert highlighted_marker is not None, 'No highlighted marker found for edificio=5'
        # Assert map centers on specified GPS coordinates from ?coords=19.05,-98.22
        map_center_coords = await page.evaluate('''() => {
          const map = window.mapInstance;
          if (!map) return null;
          const center = map.getCenter();
          return { lat: center.lat, lng: center.lng };
        }''')
        assert map_center_coords is not None, 'Map instance not found on page for coords test'
        expected_coords = (19.05, -98.22)
        assert abs(map_center_coords['lat'] - expected_coords[0]) < 0.01 and abs(map_center_coords['lng'] - expected_coords[1]) < 0.01, f'Map center {map_center_coords} not close to expected coords'
        # Verify no error messages or alerts on the page
        error_alert = await page.query_selector('.error, .alert, .notification-error')
        assert error_alert is None, 'Error or alert found on page when using coords parameter'] }  }  }
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    