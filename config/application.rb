module Chromeshot
  class Application < Rails::Application
    config.assets.paths << Rails.root.join('node_modules')
  end
end
