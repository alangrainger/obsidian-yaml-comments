import { DataWriteOptions, Plugin, TFile } from 'obsidian'

export default class YamlComments extends Plugin {
  originalProcessFrontMatter: {
    (file: TFile, fn: (frontmatter: any) => void, options?: DataWriteOptions | undefined): Promise<void>;
    (file: TFile, fn: (frontmatter: any) => void, options?: DataWriteOptions | undefined): Promise<void>;
    call?: any;
  }

  async onload () {
    // Store the original processMatterFunction reference
    this.originalProcessFrontMatter = this.app.fileManager.processFrontMatter

    // Replace it with our new custom function that does the same thing
    // but also keeps the YAML comments
    this.app.fileManager.processFrontMatter = async (file, fn) => {
      console.log('Processing YAML')

      const [originalYaml, bodyContent] = await this.getYamlAndBody(file)

      // Call the original function to update the frontmatter
      await this.originalProcessFrontMatter.call(
        this.app.fileManager,
        file,
        fn
      )

      // Get the updated frontmatter (which has had the comments stripped)
      const [newYaml, _] = await this.getYamlAndBody(file)

      const newYamlWithComments = this.processComments(originalYaml, newYaml)
      const newContent = newYamlWithComments + bodyContent
      await this.app.vault.modify(file, newContent)
    }
  }

  async onunload () {
    // Restore the original function when plugin unloads
    if (this.originalProcessFrontMatter) {
      this.app.fileManager.processFrontMatter = this.originalProcessFrontMatter
    }
  }

  async getYamlAndBody (file: TFile) {
    const originalContent = await this.app.vault.read(file)
    const frontmatterMatch = originalContent.match(/^(---\n.*?\n---\r?\n)/s)
    const yaml = frontmatterMatch?.[1] || ''
    const body = originalContent.replace(yaml, '')

    return [yaml, body]
  }

  processComments (originalYaml: string, newYaml: string) {
    const fullMatches = originalYaml.matchAll(/((?:^\s*#.*(?:\r?\n|$))+)\s*(^\s*[^#\n]+)/mg)
    for (const match of fullMatches) {
      if (match.length < 3) continue
      const comment = match[1]
      const lineFollowingComment = match[2].trim()
      newYaml = this.injectCommentInCorrectPlace(comment, lineFollowingComment, newYaml)
    }
    return newYaml
  }

  injectCommentInCorrectPlace (comment: string, key: string, yaml: string) {
    const lines = yaml.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === key) {
        lines[i] = comment + lines[i]
      }
    }
    return lines.join('\n')
  }
}
