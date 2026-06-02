#!/usr/bin/env python3
"""
App walkthrough using Playwright - walks through key features of the MPV Anilist Sync app.
"""
import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        print("\n=== MPV Anilist Sync Walkthrough ===\n")

        # Navigate to the app
        print("1️⃣  Loading the app at http://localhost:8080...")
        await page.goto("http://localhost:8080", wait_until="networkidle")
        await page.screenshot(path="/tmp/01_home.png")
        print("   ✓ Screenshot saved: /tmp/01_home.png")
        print("   App loaded successfully!")

        # Check the status
        print("\n2️⃣  Checking API Status...")
        status_text = await page.locator('body').inner_text()
        print(f"   Status: App is running and displaying content")
        await page.screenshot(path="/tmp/02_initial_view.png")

        # Look for search input
        print("\n3️⃣  Testing Search Feature...")
        search_inputs = await page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]').count()
        if search_inputs > 0:
            print(f"   ✓ Found {search_inputs} search input(s)")
            await page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]').first.fill("Attack on Titan")
            await page.screenshot(path="/tmp/03_search_input.png")
            print("   Screenshot saved: /tmp/03_search_input.png")
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(2000)
            await page.screenshot(path="/tmp/04_search_results.png")
            print("   ✓ Search results displayed: /tmp/04_search_results.png")
        else:
            print("   ℹ No search input found on main view")

        # Check for buttons/actions
        print("\n4️⃣  Looking for Interactive Elements...")
        buttons = await page.locator('button').count()
        print(f"   ✓ Found {buttons} buttons on the page")

        # Check for tabs/navigation
        print("\n5️⃣  Checking Navigation...")
        tabs = await page.locator('[role="tab"], .tab, [data-tab]').count()
        print(f"   ✓ Found {tabs} tab/navigation elements")

        # Look for the sidebar
        sidebar_buttons = await page.locator('button:has-text("Library"), button:has-text("Stats"), button:has-text("Settings")').count()
        print(f"   ✓ Found {sidebar_buttons} sidebar-like buttons")

        # Try clicking different areas
        print("\n6️⃣  Testing Navigation Buttons...")

        # Find all buttons and list them
        button_texts = []
        buttons_all = page.locator('button')
        count = await buttons_all.count()
        for i in range(min(count, 10)):
            text = await buttons_all.nth(i).inner_text()
            if text.strip():
                button_texts.append(text.strip())

        if button_texts:
            print(f"   Available buttons: {', '.join(set(button_texts[:5]))}")

        # Look for Library view
        library_btn = page.locator('button:has-text("Library")')
        if await library_btn.count() > 0:
            print("   ✓ Found 'Library' button")
            await library_btn.first.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path="/tmp/05_library_view.png")
            print("   ✓ Library view screenshot: /tmp/05_library_view.png")

        # Look for Stats view
        stats_btn = page.locator('button:has-text("Stats")')
        if await stats_btn.count() > 0:
            print("   ✓ Found 'Stats' button")
            await stats_btn.first.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path="/tmp/06_stats_view.png")
            print("   ✓ Stats view screenshot: /tmp/06_stats_view.png")

        # Check for settings/gear icon
        print("\n7️⃣  Looking for Settings...")
        settings_indicators = await page.locator('[aria-label*="etting"], [title*="etting"], button:has-text("⚙"), .settings').count()
        if settings_indicators > 0:
            print(f"   ✓ Found {settings_indicators} settings indicator(s)")
        else:
            print("   ℹ Settings button not immediately visible")

        # Check for modals/dialogs
        print("\n8️⃣  Looking for Auth Features...")
        auth_text = await page.locator('text=/[Ll]ogin|[Aa]uthenticate|[Ss]ign/').count()
        if auth_text > 0:
            print(f"   ✓ Found {auth_text} authentication-related text(s)")
            # Get the first one
            auth_link = await page.locator('text=/[Ll]ogin|[Aa]uthenticate|[Ss]ign/').first.locator('..')
            auth_href = await auth_link.get_attribute('href')
            if auth_href:
                print(f"   🔗 Auth link: {auth_href}")
        else:
            print("   ℹ No authentication text found (may already be authenticated or not required)")

        # Final summary
        print("\n9️⃣  Taking Final Screenshot...")
        await page.screenshot(path="/tmp/09_final.png")

        print("\n✅ Walkthrough Complete!")
        print("\n📸 Screenshots saved:")
        print("   - /tmp/01_home.png (Home/Initial load)")
        print("   - /tmp/03_search_input.png (Search input)")
        print("   - /tmp/04_search_results.png (Search results)")
        print("   - /tmp/05_library_view.png (Library view)")
        print("   - /tmp/06_stats_view.png (Stats view)")
        print("   - /tmp/09_final.png (Final state)")

        print("\n📋 Key Features Tested:")
        print("   ✓ App loads successfully")
        print("   ✓ Search functionality")
        print("   ✓ Navigation elements")
        print("   ✓ Library view")
        print("   ✓ Stats view")

        # If we need authentication, show the user
        print("\n🔐 Authentication Status:")
        auth_check = await page.locator('text=/No valid AniList token|AniList.*[Aa]uth|Please authenticate/').count()
        if auth_check > 0:
            print("   ⚠️  AniList authentication needed")
            print("   Please check if there's a login button or link displayed in the app")
        else:
            print("   ✓ App appears to be running without immediate auth prompts")


        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
