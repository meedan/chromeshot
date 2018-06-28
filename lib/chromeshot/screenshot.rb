require 'shellwords'
require 'mini_magick'

module Chromeshot
  class Screenshot

    attr_accessor :debug_port

    def self.setup_chromeshot(debug_port)
    end

    def initialize(options = {})
      self.debug_port = options[:debug_port] || 9555
    end

    def take_screenshot(options = {})

      system "LC_ALL=C google-chrome --headless --enable-logging --hide-scrollbars --remote-debugging-port=#{self.debug_port} --remote-debugging-address=0.0.0.0 --disable-gpu --no-sandbox --ignore-certificate-errors &"
      sleep(30);

      screenshoter = File.join Chromeshot.root, 'bin', 'take-screenshot.js'
      system 'nodejs', screenshoter, "--url=#{options[:url]}", "--output=#{options[:output]}", "--delay=5", "--debugPort=#{self.debug_port}", "--full=true", "--script=#{options[:script]}"
      system 'convert', options[:output], '-trim', '-strip', '-quality', '90', options[:output]
    end

    # Load page in a new tab, set the viewport size, wait a little and return the tab id
    def load_page_in_new_tab(options = {})
      screenshoter = File.join Chromeshot.root, 'bin', 'load-screenshot.js'
      tab = `nodejs #{screenshoter} --url='#{options[:url]}' --delay=5 --debugPort=#{self.debug_port}`
      tab.chomp
    end

    # Take the screenshot of a page that is already loaded
    def take_screenshot_from_tab(options = {})
      screenshoter = File.join Chromeshot.root, 'bin', 'save-screenshot.js'
      system 'nodejs', screenshoter, "--tab=#{options[:tab]}", "--output=#{options[:output]}", "--debugPort=#{self.debug_port}", "--script=#{options[:script]}"
      system 'convert', options[:output], '-trim', '-strip', '-quality', '90', options[:output]
    end

    def take_screenshot!(params = {})
      begin
        take_screenshot(params)
      rescue => e
        raise ChromeshotError.new("Error: #{e.message.inspect}")
      end
    end

    def post_process_screenshot(options = {})
      begin
        image = MiniMagick::Image.open(options[:original])

        w, h = image.width, image.height
        ratio = w.to_f / h.to_f
        extent = [w, h]

        w = h * options[:proportion] if ratio < options[:proportion]
        h = w / options[:proportion] if ratio > options[:proportion]

        image.combine_options do |c|
          c.gravity 'center'
          c.extent [w, h].join('x')
        end
        image.write(options[:output])
      rescue => e
        raise ChromeshotError.new("Error: #{e.message.inspect}")
      end
    end

  end
end
