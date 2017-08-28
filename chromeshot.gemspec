Gem::Specification.new do |s|
  s.name        = 'chromeshot'
  s.version     = '0.0.0'
  s.date        = '2017-08-24'
  s.summary     = 'Captures a web page as a screenshot using Chrome-based screenshotting'
  s.description = 'Captures a web page as a screenshot using Chrome-based screenshotting'
  s.authors     = ["Daniela Feitosa"]
  s.email       = 'daniela@meedan.com'
  s.files       = `git ls-files`.split($/)
  s.homepage    = 'https://github.com/meedan/chromeshot'
  s.license     = 'MIT'

  s.add_dependency 'mini_magick'
end
