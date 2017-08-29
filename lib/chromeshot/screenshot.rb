require 'shellwords'
require 'mini_magick'

module Chromeshot
  class Screenshot

    attr_accessor :debug_port

    def self.setup_chromeshot(debug_port)
      system "LC_ALL=C google-chrome --headless --hide-scrollbars --remote-debugging-port=#{debug_port} --disable-gpu --no-sandbox --ignore-certificate-errors &"
    end

    def initialize(options = {})
      self.debug_port = options[:debug_port] || 9555
    end

    def take_screenshot(options = {})
      screenshoter = File.join Chromeshot.root, 'bin', 'take-screenshot.js'
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
