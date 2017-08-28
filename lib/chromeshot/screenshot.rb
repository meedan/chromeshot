require 'shellwords'

module Chromeshot
  class Screenshot

    attr_accessor :debug_port

    def initialize(options = {})
      self.debug_port = options[:debug_port] || 9555
      Chromeshot::Screenshot.setup_chromeshot(self.debug_port)
    end

    def self.setup_chromeshot(debug_port)
      system "LC_ALL=C google-chrome --headless --hide-scrollbars --remote-debugging-port=#{debug_port} --disable-gpu --no-sandbox --ignore-certificate-errors &"
    end

    def take_screenshot(options = {})
      screenshoter = File.join('bin', 'take-screenshot.js')
      system 'nodejs', screenshoter, "--url=#{options[:url]}", "--output=#{options[:output]}", "--delay=3", "--debugPort=#{self.debug_port}"
      system 'convert', Shellwords.escape(options[:output]), '-trim', '-strip', '-quality', '90', Shellwords.escape(options[:output])
    end

    def take_screenshot!(params = {})
      begin
        take_screenshot(params)
      rescue => e
        raise ChromeshotError.new("Error: #{e.message.inspect}")
      end
    end

  end
end
